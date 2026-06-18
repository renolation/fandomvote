# Backend Spec Hardening — Khuyến nghị cho 23 điểm cần lưu ý

> Nguồn: review `backend/backend.CLAUDE.md` (đối chiếu `web/`, `mobile/`). Giai đoạn spec-only, chưa có code.
> Mục tiêu: chốt giải pháp cụ thể trước khi code Phase 0. Định dạng mỗi điểm: **Chốt → Cơ chế → Snippet/schema (nếu cần)**.

---

## 🔴 NHÓM 1 — Correctness (sai = mất tiền / vỡ invariant)

### 1. Lock per-user thay cho `SUM() FOR UPDATE`
**Chốt:** Bỏ ý tưởng lock aggregate. Mọi transaction *mutate ví* mở đầu bằng **advisory lock theo user**, rồi mới tính `SUM`.

**Cơ chế:** `pg_advisory_xact_lock` (xact-scoped → tự nhả khi commit, hợp pgBouncer transaction mode — xem #11). 1 key/user → serialize toàn bộ thao tác tiền của user đó.

```typescript
// common/utils/wallet-lock.util.ts
export async function lockUser(tx: DbOrTx, userId: string): Promise<void> {
  // serialize tất cả thao tác ví của 1 user trong phạm vi transaction hiện tại
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
}
```

```typescript
// vote.service.ts
return this.db.transaction(async (tx) => {
  await lockUser(tx, userId);          // serialize trước
  const bal = await getBalances(tx, userId); // SUM an toàn sau khi đã lock
  // ...check + debit + insert vote_logs...
});
```

- Stock deal: lock **row** `SELECT ... FROM shop_deals WHERE id=$1 FOR UPDATE`.
- `campaign_idols.total_votes += N`: bản thân UPDATE đã giữ row lock.
- **Thứ tự lock cố định:** user-lock → resource row (deal/idol) để tránh deadlock.

### 2. FIFO lot-tracking cho Green (sửa bug balance ÂM) — *điểm nặng nhất*
**Chốt:** Giữ ledger append-only + `balance = SUM(amount active)`. Sửa bằng cách **dòng debit Green mang `expires_at` đúng bằng lot bị tiêu** + tham chiếu lot (`consumes_ledger_id`). Trải nhiều lot → tách nhiều dòng debit.

**Vì sao:** Nếu debit để `expires_at = NULL`, khi lot credit hết hạn rớt khỏi SUM mà dòng debit âm còn lại → balance âm. Gắn cùng `expires_at` → credit + debit của cùng lot **rớt cùng nhau** → balance luôn đúng. Càng quan trọng vì tồn tại **2 rổ hạn song song**: daily (cuối ngày) + referral PA-B (`now+7d`).

**Schema delta:** `wallet_ledger` thêm `consumes_ledger_id bigint NULL` (FK self → lot bị tiêu; chỉ set cho debit GREEN).

**Thuật toán trừ Green (FIFO theo expiry sớm nhất trước):**
```
debitGreen(tx, userId, needed):
  lots = SELECT id, expires_at, (amount + COALESCE(Σ debit gắn lot này,0)) AS remaining
         FROM wallet_ledger
         WHERE user_id=$ AND currency=GREEN
           AND amount > 0                          -- chỉ lot credit
           AND (expires_at IS NULL OR expires_at > now())
         GROUP BY id, amount, expires_at
         HAVING remaining > 0
         ORDER BY expires_at ASC NULLS LAST, id ASC   -- hết hạn sớm tiêu trước
  for lot in lots:
     take = min(remaining(lot), needed)
     INSERT wallet_ledger(amount = -take, currency=GREEN,
                          expires_at = lot.expires_at,        -- KHỚP lot
                          consumes_ledger_id = lot.id, source=VOTE, ...)
     needed -= take
     if needed == 0: break
  if needed > 0: throw INSUFFICIENT_BALANCE   -- (không nên xảy ra nếu đã check trước)
```

- Active lot/user là **nhỏ** (today daily + vài referral trong 7d) → query bounded.
- Affordability check vẫn dùng `SUM(amount active)` đơn giản (= Σ remaining) — đúng.
- **Gold/Diamond KHÔNG cần lot** (không hết hạn): debit 1 dòng, `expires_at = NULL`, `consumes_ledger_id = NULL`.

### 3. Hoàn vote (campaign hủy / gỡ idol) — *cần quyết business, đề xuất mặc định*
**Chốt đề xuất:**
- **Gold** → hoàn lại **Gold** (không hạn). Thẳng.
- **Green** → hoàn lại **Green mới**, `expires_at = end-of-day hôm hoàn`, **gắn flag miễn trần** (đây là refund, không phải earn — không cộng `green_earned_today`). *Không* hoàn Green thành Gold (tránh "rửa" Green 0đ thành Gold có giá trị).
  - *Phương án thay thế (đơn giản hơn):* Green đã hết hạn lúc hủy → **forfeit, không hoàn** (Green vốn 0đ, đằng nào cũng hết hạn). Chọn 1.
- Reversal = INSERT dòng bù `source=VOTE_REVERSAL`, `ref_type=campaign|vote_log`. Giảm `campaign_idols.total_votes`.
- **Chặn** reversal nếu campaign đã `RESOLVED` (chỉ cho DRAFT/OPEN/CLOSED-trước-resolve).
- Bulk: xử lý **per-user dưới advisory lock của user đó**; 1 idempotency key/`(campaign,user)`.

### 4. Idempotency — nhánh đụng độ (race)
**Chốt:** Dựa vào **chính hành vi block của unique index** + advisory user-lock (#1) → race tự được serialize. Không cần polling phức tạp.

```typescript
// đầu service cấp cao, TRONG transaction, SAU lockUser()
try {
  await tx.insert(idempotencyKeys).values({ key, userId, scope, status: 'PENDING' });
} catch (e) {
  if (isUniqueViolation(e)) {                 // 23505
    const row = await tx.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    if (row.status === 'DONE') return row.responseJson;   // trả kết quả cũ
    throw new BusinessException('IN_PROGRESS', 409);       // client retry
  }
  throw e;
}
// ...chạy logic... rồi:
await tx.update(idempotencyKeys).set({ status: 'DONE', responseJson }).where(eq(..., key));
```

- Nhờ advisory lock per-user, request thứ 2 cùng user **chờ ở lock** rồi đọc thấy `DONE` → trả cache (đường mượt). Insert-block chỉ là lớp phòng cho cross-connection.
- **TTL cleanup:** job daily `DELETE WHERE expires_at < now()`. `expires_at`: vote/redeem ~24–48h; **webhook key giữ lâu (~90d)** để chống replay qua chu kỳ retry của provider.

---

## 🟠 NHÓM 2 — Security & vận hành

### 5. Rate limiting
**Chốt:** `@nestjs/throttler`. Mặc định global nhẹ + tier nghiêm cho nhạy cảm.
- `/auth/login`, `/auth/register`, `/verify/*`: chặt (vd 5–10/phút/IP + /user).
- `/vote`: vừa (chống spam, nhưng idempotency đã chống double-tap).
- Webhook: **không throttle theo user** (provider gọi) — bảo vệ bằng signature + idempotency.
- Key theo cả IP và userId.

### 6. Google/Gmail OAuth (client có, backend thiếu)
**Chốt:** Endpoint `POST /auth/google` nhận **Google ID token** từ client → verify chữ ký bằng cert Google (check `aud=client_id`, `iss`, `exp`) → tìm/tạo user theo email đã verify → cấp JWT pair của ta.
- **Schema `users`:** `auth_provider enum(LOCAL,GOOGLE) default LOCAL`, `google_sub text UNIQUE NULL`, `password_hash` → **nullable** (user Google không có).
- Email từ Google coi như đã verify → set `email_verified_at` luôn (ảnh hưởng #7/#21 referral).
- Mã mời nhập ở popup client → gửi kèm lần đăng ký đầu.

### 7. Verify email/SĐT (referral phụ thuộc)
**Chốt:** Bảng mới + 2 kênh.
```
verification_tokens(
  id, user_id, channel ENUM(EMAIL,PHONE), purpose ENUM(VERIFY_EMAIL,VERIFY_PHONE),
  token_hash, expires_at, consumed_at, created_at)
```
- Email: link/mã 6 số. Phone: OTP qua SMS provider (secret ở env, #23).
- Verify thành công → set `users.email_verified_at`/`phone_verified_at` → kích hoạt chuyển `referrals.PENDING→REWARDED` (dưới lock counter referrer, #21).
- Throttle gửi OTP (#5).

### 8. Admin audit log
**Chốt:** Bảng append-only, ghi **cùng transaction** với hành động admin.
```
admin_audit_log(id, admin_id, action, target_type, target_id, metadata JSONB, created_at)
```
Áp cho: duyệt idol, tạo/sửa campaign, chạy resolution, chỉnh ví/clawback, đổi config. Bắt buộc cho tranh chấp/gian lận.

### 9. Địa chỉ giao hàng PHYSICAL (PII)
**Chốt:** Bảng riêng, link từ gift item physical.
```
shipping_addresses(id, user_id, recipient, phone, line1, line2, ward, district, province, note, created_at)
-- gift_wallet_items.shipping_address_id NULL (chỉ PHYSICAL khi CONFIRMED)
```
Lưu ý PII: không log, hạn chế truy cập (admin xử đơn). Thu địa chỉ ở bước user CONFIRMED.

### 10. Refresh token — phát hiện reuse/theft
**Chốt:** Thêm `refresh_tokens.family_id uuid` (1 family/lần login). Rotation: revoke token cũ, cấp mới **cùng family**. Nếu nhận **token đã `revoked_at`** (reuse) → **revoke toàn bộ family** → buộc login lại. Đây là dấu hiệu token bị đánh cắp.

### 11. Pooling mode vs lock (infra correctness)
**Chốt:** Supabase/Neon dùng pgBouncer → cấu hình **transaction pooling**. Hệ quả:
- Chỉ dùng `pg_advisory_xact_lock` (xact-scoped). **Cấm** `pg_advisory_lock` session-level (rò rỉ lock qua pooler).
- Tránh prepared-statement/session state phụ thuộc connection. Drizzle client cấu hình phù hợp transaction mode.
- Ghi rõ pool mode trong `config/database.config.ts` + comment ở `drizzle.provider.ts`.

### 12. Reconciliation runtime + alert (không chỉ test)
**Chốt:** Job scheduled daily chạy invariant §12 (3,4,5 + balance≥0) bằng SQL trên prod → log + **alert khi lệch** (notification admin / kênh ngoài). Test invariant chỉ chặn ở CI; prod cần giám sát chạy thật.

### 13. Offerwall chargeback → Gold âm — *cần quyết business, đề xuất mặc định*
**Chốt đề xuất:** **Cho phép Gold âm** qua dòng clawback `source=OFFERWALL_CHARGEBACK` (amount âm):
- Còn Gold đủ → trừ thẳng.
- Đã tiêu hết → balance âm = **nợ**; affordability check (balance<0) tự chặn mọi chi tiêu tiếp; **flag/freeze account** chờ review. **Không** đảo các vote đã cast (bất công với idol).
- Giữ invariant 3 (Σ Gold ≈ doanh thu) trung thực.
- *Thay thế:* cap ở 0 + ghi nhận write-off + flag user (đơn giản hơn nhưng lệch đối soát). Đề xuất chọn **cho âm + flag**.
- IAP thật: thêm **server-side receipt validation** (App Store Server Notifications v2 / Google Play RTDN), không chỉ webhook chung.

---

## 🟡 NHÓM 3 — Cần làm rõ

### 14. Làm tròn quỹ — *cần quyết business, đề xuất mặc định*
**Chốt đề xuất:** `floor` (làm tròn xuống) — platform không cam kết donate vượt số thu.
- Sửa invariant §12.5: `fund = floor(Σ vote_logs.GOLD × donation_ratio)`.
- "Dust" lẻ giữ lại platform (ghi rõ).

### 15. Tie-break first-to-reach — thứ tự tất định
**Chốt:** `vote_logs.id bigserial` (đơn điệu tăng) + `created_at timestamptz` precision cao. First-to-reach: tại mức điểm hòa, so `(created_at, id)` của dòng `running_total` chạm mức đó trước; **`id` là tiebreak cuối cùng** (không bao giờ trùng).

### 16. Check-in 1 lần/ngày
**Chốt (KISS):** Thêm cờ vào `green_daily_counter` (đã per-day, #17): `checkin_claimed_at timestamptz NULL`. Claim check-in = set cờ dưới lock; đã set → reject `ALREADY_CLAIMED`. Khỏi bảng mới.

### 17. Reset `green_daily_counter`
**Chốt (KISS):** **1 row per `(user_id, date)`** (composite PK). Upsert lazy lần earn đầu trong ngày → **không cần reset** (ngày mới = row mới). Prune row >2 ngày bằng cleanup job. `green_earned_today` = counter của row hôm nay.

### 18. Trigger OPEN→CLOSED + snapshot
**Chốt (hybrid):**
- **Enforce vote lazy:** reject vote nếu `now > close_at` bất kể status → không bao giờ vote trễ.
- **Flip status + snapshot:** scheduler nhẹ (1 phút/lần) `UPDATE campaigns SET status='CLOSED', closed_at=now() WHERE status='OPEN' AND close_at <= now()` → chỉ 1 worker thắng (atomic). Sau CLOSED → snapshot leaderboard.
- **Schema:** thêm `campaign_snapshots(campaign_id, campaign_idol_id, rank, total_votes, reached_value_at, snapshotted_at)` (immutable) **hoặc** cờ `campaigns.snapshotted_at` + freeze `campaign_idols`. Snapshot idempotent (guard `snapshotted_at IS NULL`).
- Scheduler cho campaign lifecycle là chấp nhận được (ít campaign) — khác với việc cố tránh cron cho Green expiration.

### 19. Resolution — idempotency + state guard
**Chốt:** CAS atomic mở resolution:
```sql
UPDATE campaigns SET status='RESOLVING' WHERE id=$1 AND status='CLOSED';
-- rowcount 0 → abort (đã/đang resolve), chống double-run
```
- Toàn bộ tính quỹ + donation_receipts + LED + consolation trong 1 transaction (hoặc saga + idempotency key/bước nếu quá lớn).
- `donation_receipts` unique `(campaign_id)` → insert idempotent. Xong → `status='RESOLVED'`.
- Chỉ dựa **snapshot đông cứng** (#18), không đọc live.

### 20. Cache & scale (note, chưa cần làm ngay)
**Chốt:**
- Index leaderboard: `campaign_idols(campaign_id, total_votes DESC, reached_value_at)`.
- Balance Gold/Diamond SUM toàn lịch sử sẽ phình → **rollup checkpoint** sau (định kỳ chèn 1 dòng net + cờ checkpoint, SUM chỉ từ checkpoint). Phase đầu: index `(user_id, currency, expires_at)` + SUM là đủ.
- **Redis:** chưa thêm vào stack (YAGNI), nhưng **bọc đọc balance/leaderboard sau service method** để sau slot cache vào không đụng caller. Client poll 5–10s → khi lên scale mới cần.

### 21. Referral cap concurrency + anti-fraud
**Chốt:**
- Reward dưới **lock counter referrer**: `lockUser(tx, referrerId)` → đếm `REWARDED` → `<50` → reward + set `REWARDED`. Chống vượt trần khi nhiều referee verify đồng thời.
- **Schema:** `referrals.signup_ip inet`, `referrals.device_fingerprint text`; `users` lưu device/IP lúc register. Chặn: `referrer ≠ referee`, nghi cùng device/IP/SĐT (ngưỡng configurable trong `platform_config`).

### 22. Phân trang
**Chốt:** **Cursor/keyset** cho ledger, notification, vote-activity:
```sql
WHERE (created_at, id) < ($cursor_ts, $cursor_id)
ORDER BY created_at DESC, id DESC LIMIT $n
```
Offset chỉ cho bảng admin nhỏ. Đặt chuẩn ở `common/dto/pagination`.

### 23. Tách secret khỏi `platform_config`
**Chốt:**
- `platform_config` = **chỉ số nghiệp vụ** (ratio, trần, multiplier, hạn referral, contact).
- **Secret** (JWT secret, webhook signing key, SMS/email/OAuth credential) = **env** qua `@nestjs/config`. Ghi rõ ranh giới ở §11/§14.

---

## Tổng hợp Schema delta (gộp vào §12)

**Bảng mới:** `verification_tokens`, `admin_audit_log`, `shipping_addresses`, `campaign_snapshots`.

**Cột thêm:**
- `wallet_ledger`: `consumes_ledger_id bigint NULL` (FIFO lot, #2).
- `users`: `auth_provider`, `google_sub UNIQUE NULL`, `password_hash` → NULL, `email_verified_at`, `phone_verified_at`, `signup_ip`, `device_fingerprint`.
- `refresh_tokens`: `family_id uuid`.
- `referrals`: `signup_ip inet`, `device_fingerprint text`.
- `green_daily_counter`: PK `(user_id, date)`, `checkin_claimed_at`.
- `campaigns`: `closed_at`, `snapshotted_at`.
- `gift_wallet_items`: `shipping_address_id NULL`.
- `vote_logs`: đảm bảo `id bigserial` (tiebreak, #15).

**Enum thêm `source`:** `VOTE_REVERSAL`, `OFFERWALL_CHARGEBACK`.

**Job scheduled cần có:** campaign lifecycle (1'/lần, #18), idempotency TTL cleanup (daily, #4), green_daily_counter prune (daily, #17), reconciliation (daily, #12).

---

## Thứ tự ưu tiên trước Phase 0
`#2 FIFO Green` → `#1 lock` → `#4 idempotency race` → `#11 pool/lock` → `#5 rate limit` → `#6/#7 OAuth+verify`.
4 cái đầu định hình `wallet_ledger` + nền transaction — sai là phải migrate lại.

---

## Unresolved questions (cần user quyết)
1. **#3 — Hoàn Green đã hết hạn khi hủy campaign:** hoàn Green mới (end-of-day) *hay* forfeit?
2. **#13 — Offerwall chargeback:** cho Gold âm + flag *hay* cap ở 0 + write-off?
3. **#14 — Làm tròn quỹ:** `floor` (đề xuất) *hay* `round`?
4. **#3 phụ — Refund Green miễn trần?** Refund có cộng `green_earned_today` không (đề xuất: không).
5. **#18 — Chấp nhận scheduler 1'/lần cho campaign lifecycle?** (mâu thuẫn nhẹ với tinh thần "no cron").
6. **#6 — Google OAuth phase nào?** Client ghi từ Phase 0/1; backend §11 chưa có → cần đưa vào Phase 0 cùng auth.
