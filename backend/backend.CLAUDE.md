# CLAUDE.md — Backend (NestJS + Drizzle)

> Nguồn chân lý cho `fdv/backend`. Đọc hết trước khi chạm code. Backend là **nơi duy nhất** chứa business logic của FandomVote (FDV). Web/Mobile chỉ gọi API.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **TẤT CẢ business logic ở đây.** Không tin client về số dư, điểm, tiền, thời gian.
2. **Ví = ledger.** KHÔNG có cột `balance`. Balance = `SUM(amount)` các dòng `wallet_ledger`. Mọi thay đổi ví = **thêm 1 dòng**; không UPDATE/DELETE dòng cũ.
3. **Thao tác tiền tệ ATOMIC.** Bọc `db.transaction`; serialize ví bằng **`pg_advisory_xact_lock(user)`** (KHÔNG `SUM() FOR UPDATE` — Postgres cấm lock aggregate), `FOR UPDATE` cho row (stock/idol). Lỗi 1 bước → rollback toàn bộ.
4. **Giờ server UTC+7 (`Asia/Ho_Chi_Minh`), khóa cứng.** Campaign open/close, hạn Green, point event đều theo giờ server.
5. **Config thay vì hard-code.** ratio, multiplier, contact, trần, hạn… đọc từ `platform_config`/bảng config.
6. **Verify trước khi cộng tiền.** Gold (offerwall/video) cần S2S postback verify signature. Diamond cần webhook xác nhận + chống replay.
7. **Tiền = số nguyên (`bigint`).** Đơn vị nhỏ nhất (Green/Gold/Diamond đếm theo "viên", VND theo đồng). **Cấm float** cho mọi giá trị tiền tệ.

---

## 1. Quyết định kiến trúc đã CHỐT (bắt buộc tuân theo)

> Phong cách **modular feature-based theo Nest docs** (KHÔNG phải Clean Architecture thuần DDD). Đã cân nhắc và chốt — agent không tự đổi.

### 1.1 Không có tầng repository
Service **gọi thẳng Drizzle**. KHÔNG tạo `*.repository.ts`. Lý do: ít tầng, và để truyền `tx` gọn gàng (xem 1.2). SQL/Drizzle query sống ngay trong service.

### 1.2 Truyền transaction (`tx`) TƯỜNG MINH qua tham số
- Service cấp cao (vote, redeem deal, resolution, topup…) là nơi **mở** `db.transaction`.
- Service phụ (ledger, green-counter, notification…) **nhận `tx` làm tham số**, KHÔNG tự mở transaction.
- Quy ước kiểu: dùng một alias dùng chung cho cả `db` và `tx`.

```typescript
// db/types.ts
import { db } from './drizzle.provider';
export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
```

```typescript
// ledger.service.ts — service phụ: NHẬN tx, không tự mở transaction
@Injectable()
export class LedgerService {
  // credit: cộng (amount > 0). debit: trừ (amount < 0). Cả hai chỉ INSERT dòng.
  async credit(tx: DbOrTx, input: CreditInput): Promise<void> {
    await tx.insert(walletLedger).values({
      userId: input.userId,
      currency: input.currency,
      amount: input.amount,            // luôn dương ở credit
      source: input.source,
      expiresAt: input.expiresAt ?? null,
      realValueVnd: input.realValueVnd ?? 0,
      refType: input.refType,
      refId: input.refId,
    });
  }

  async debit(tx: DbOrTx, input: DebitInput): Promise<void> { /* INSERT amount âm */ }
}
```

```typescript
// vote.service.ts — service cấp cao: MỞ transaction, truyền tx xuống
async cast(userId: string, dto: CastVoteDto) {
  return this.db.transaction(async (tx) => {
    // ...lock + check + ledger.debit(tx, ...) + insert vote_logs...
  });
}
```

**Quy tắc bất di:** nếu một method có thể được gọi bên trong transaction của method khác → nó PHẢI nhận `tx`. Không bao giờ một thao tác ví tự mở transaction riêng rồi bị gọi lồng.

### 1.3 Dữ liệu là plain object, hành vi ở service
- Drizzle khai báo bảng → dùng `typeof table.$inferSelect` / `$inferInsert` làm **type**.
- Object trả về từ query là **plain object** (không phải class, không method). KHÔNG dựng domain entity class có hành vi.
- Hành vi nghiệp vụ (canAfford, isExpired, tính balance…) nằm trong **service**, không gắn vào object dữ liệu.

### 1.4 Ba loại "class" trong dự án
- **Schema** (`db/schema/`): `pgTable(...)` const → suy ra type. KHÔNG phải class.
- **DTO** (`modules/*/dto/`): `class` + class-validator + Swagger decorator → input/output API.
- **Service** (`*.service.ts`): `@Injectable()` class chứa logic. Đây là nơi duy nhất có transaction.

---

## 2. Stack
- **NestJS** (TypeScript), modular feature-based.
- **Drizzle ORM** (SQL-first) — transaction, `FOR UPDATE`.
- **PostgreSQL managed** (Supabase/Neon/RDS — chỉ dùng Postgres, auth tự viết).
- **JWT tự viết** — Access 15–30', Refresh xoay vòng lưu DB. Hash mật khẩu **argon2**.
- **OpenAPI/Swagger** tự sinh → Flutter generate model Dart.

---

## 3. Cấu trúc thư mục

```
backend/src/
├── main.ts                       # bootstrap, Swagger, global pipe/filter, prefix /api/v1
├── app.module.ts
│
├── config/                       # @nestjs/config
│   ├── app.config.ts             # port, TIMEZONE=Asia/Ho_Chi_Minh
│   ├── jwt.config.ts
│   ├── database.config.ts
│   └── config.module.ts
│
├── db/                           # Drizzle (shared infra, ngoài modules)
│   ├── drizzle.module.ts         # provider inject `db` (global)
│   ├── drizzle.provider.ts
│   ├── types.ts                  # DbOrTx (xem 1.2)
│   ├── schema/                   # 1 file/bảng, gộp ở index.ts
│   │   ├── enums.ts              # pgEnum: currency, source, status...
│   │   ├── users.schema.ts
│   │   ├── refresh-tokens.schema.ts
│   │   ├── wallet-ledger.schema.ts
│   │   ├── green-daily-counter.schema.ts
│   │   ├── idempotency-keys.schema.ts
│   │   ├── idols.schema.ts
│   │   ├── campaigns.schema.ts
│   │   ├── campaign-idols.schema.ts
│   │   ├── vote-logs.schema.ts
│   │   ├── partners.schema.ts
│   │   ├── shop-deals.schema.ts
│   │   ├── gift-wallet-items.schema.ts
│   │   ├── iap-packages.schema.ts
│   │   ├── daily-rewards-config.schema.ts
│   │   ├── point-events.schema.ts
│   │   ├── referrals.schema.ts
│   │   ├── notifications.schema.ts
│   │   ├── donation-receipts.schema.ts
│   │   ├── platform-config.schema.ts
│   │   └── index.ts
│   ├── migrations/               # drizzle-kit generate — KHÔNG sửa file đã chạy
│   └── seed/                     # seed platform_config, daily_rewards mặc định
│
├── common/
│   ├── decorators/               # @CurrentUser, @Roles, @IdempotencyKey
│   ├── guards/                   # jwt-auth.guard, roles.guard (USER/ADMIN)
│   ├── interceptors/             # logging, transform-response ({ data })
│   ├── filters/                  # all-exceptions.filter (map BusinessException → mã + HTTP)
│   ├── exceptions/               # BusinessException base + các lỗi nghiệp vụ
│   ├── pipes/                    # validation
│   ├── dto/                      # pagination, api-response
│   └── utils/
│       ├── time.util.ts          # giờ UTC+7, end-of-day expires_at
│       ├── normalize-name.util.ts# name_normalized
│       └── money.util.ts         # quy đổi, integer
│
└── modules/
    ├── auth/        # register(+referral_code optional), login, refresh(rotation), logout
    ├── wallet/      # balance, ledger history, LedgerService, GreenCounterService
    ├── vote/        # cast vote atomic (Green→Gold), idempotency
    ├── campaign/    # state machine, leaderboard, snapshot, rules
    ├── idol/        # check-trùng real-time, nominate, kho idol
    ├── shop/        # deals(redeem atomic), gift-wallet, daily-reward
    ├── events/      # point events x2 (multiplier cao nhất, trần bonus)
    ├── referral/    # mã mời=userId, PENDING→REWARDED, chống self-referral
    ├── webhook/     # iap webhook (Diamond), offerwall postback (Gold) — verify trước khi cộng
    ├── resolution/  # Phase 4 — A/B/C, quỹ, donation receipts
    ├── notification/# in-app, badge, mark-read
    └── admin/       # controller gom riêng + RolesGuard('ADMIN')
```

Mỗi module: `*.module.ts`, `*.controller.ts` (HTTP + Swagger), `*.service.ts` (logic + Drizzle + transaction), `dto/`. Service phụ dùng chung (LedgerService, GreenCounterService, NotificationService) export từ module của nó để module khác inject.

---

## 4. Mô hình 3 loại tiền tệ

| | GREEN | GOLD | DIAMOND |
|---|---|---|---|
| Nguồn | checkin, event, referral | video, task, offerwall | nạp thật (IAP) |
| Hạn | 23:59:59 ngày đó (UTC+7) | không | không |
| Trần | ≤100 **earned**/ngày | không | không |
| Giá trị | 0đ | 1 Gold = 1đ | 1 Diamond = 1.000 Gold = 1.000đ |

**Dòng chảy MỘT CHIỀU:** `TIỀN THẬT → DIAMOND → GOLD → VOTE`, `AD → GOLD → VOTE`, `CHECKIN/REFERRAL → GREEN → VOTE`.

- **GREEN:** trần theo `green_daily_counter.green_earned_today` (earned/ngày, không phải balance). Lazy expiration — KHÔNG cron. Balance Green = `SUM(amount) WHERE currency=GREEN AND (expires_at IS NULL OR expires_at > now())`. **FIFO lot-attribution (bắt buộc):** dòng debit Green PHẢI mang `expires_at` đúng bằng lot bị tiêu + cột `consumes_ledger_id` trỏ lot; tiêu qua nhiều lot → tách nhiều dòng. Nếu để debit `expires_at=NULL`, khi lot credit hết hạn rớt khỏi SUM mà debit âm còn lại → **balance ÂM** (vỡ invariant). Tồn tại 2 rổ hạn song song: daily (cuối ngày) + referral PA-B (`now+7d`).
- **GOLD:** liability. Chỉ cộng sau S2S postback verify.
- **DIAMOND:** đổi xuống Gold một chiều (`source=DIAMOND_TO_GOLD`), không hoàn. KHÔNG vote trực tiếp. Chỉ cộng sau webhook + chống replay theo `transaction_id` unique.

---

## 5. Vote (ATOMIC)

Chỉ tiêu Green + Gold. Thứ tự trừ: **GREEN trước → GOLD sau**.

```
cast(userId, dto{campaignIdolId, amount N, idempotencyKey}):
  db.transaction(tx):
    0.  lockUser(tx, userId)  -- pg_advisory_xact_lock, serialize ví user
    0b. Idempotency: INSERT key PENDING; trùng (23505) → DONE? trả response cũ : 409 IN_PROGRESS (xem §10)
    1.  Campaign OPEN? reject nếu now > close_at (lazy, theo giờ server)
    2.  Tính balance (SAU lock): Green-chưa-hết-hạn + Gold >= N ?
    3.  debit Green trước (FIFO lot: mỗi lot 1 dòng, expires_at=lot.expires_at, consumes_ledger_id=lot.id) → hết Green trừ Gold (1 dòng, expires_at=NULL)
    4.  UPDATE campaign_idols.total_votes += N, cập nhật reached_value_at
    5.  INSERT vote_logs(id bigserial, currency, amount, real_value_vnd, running_total, created_at)
    6.  update idempotency key → DONE + cache response
    rollback nếu bất kỳ bước lỗi
```
- Vote Green: `real_value_vnd = 0` (không vào quỹ). Vote Gold: `real_value_vnd = amount`.
- `vote_logs` BẮT BUỘC ghi rõ `currency`. `running_total` + `id bigserial` phục vụ luật hòa first-to-reach (tiebreak cuối = `id`).
- **Vote không hoàn, trừ khi campaign hủy / idol gỡ** → reversal: INSERT dòng bù `source=VOTE_REVERSAL`, giảm `total_votes`; **Gold→hoàn Gold; Green→hoàn Green mới (end-of-day, miễn trần)**; chặn nếu campaign đã `RESOLVED`; xử per-user dưới lock + idempotency key `(campaign,user)`.

---

## 6. Campaign & Resolution

State: `DRAFT → OPEN → CLOSED → RESOLVING → RESOLVED → ARCHIVED`. Nhiều campaign OPEN song song, độc lập.
- `star_goal` chốt ở DRAFT, KHÔNG sửa sau OPEN.
- **OPEN→CLOSED:** vote bị chặn lazy nếu `now > close_at` (bất kể status). Scheduler nhẹ (~1'/lần) flip `status=CLOSED, closed_at=now() WHERE status='OPEN' AND close_at<=now()` (atomic, 1 worker thắng) → rồi snapshot.
- **Snapshot:** CLOSED → ghi `campaign_snapshots` (immutable: rank, total_votes, reached_value_at) idempotent (guard `snapshotted_at IS NULL`); mọi xử lý dựa snapshot. Chỉ xét **idol top 1** vs goal.
- **Luật hòa first-to-reach:** cùng điểm → idol chạm mức đó trước (`(created_at, id)` của `vote_logs` sớm hơn, `id` là tiebreak cuối) thắng.
- **Resolution idempotent:** mở bằng CAS `UPDATE campaigns SET status='RESOLVING' WHERE id=$1 AND status='CLOSED'` (rowcount 0 → abort, chống double-run); toàn bộ trong 1 transaction dựa snapshot đông cứng; xong → `RESOLVED`.
- **A** đạt mốc → Vote LED (Phase 4). **B** trượt → `Quỹ = floor(Σ GOLD-đã-vote-mọi-idol × 1đ × donation_ratio(0.5))` (làm tròn xuống, dust giữ platform), Green KHÔNG tính, sinh `donation_receipts` immutable (unique `campaign_id`). **C** thư an ủi fan hạng 2+ (song song A/B).

---

## 7. Idol
Hai tầng: kho idol (`idols.name_normalized UNIQUE`, `aliases`) ↔ `campaign_idols` (điểm riêng/campaign).
- Tạo idol mới → admin duyệt (PENDING/APPROVED/REJECTED). Đưa idol đã duyệt vào campaign → user tự do.
- Check trùng real-time theo `name_normalized` (lowercase + bỏ dấu + trim + collapse spaces — một hàm chung).

---

## 8. Shop & Events
- **Redeem deal (ATOMIC):** lock row → check `stock_sold < stock` → trừ điểm (GOLD/DIAMOND, 1 loại/deal) → `stock_sold += 1` → tạo `gift_wallet_item` (sinh `expires_at` từ `validity_days`) → ledger `source=PURCHASE`. Invariant `stock_sold <= stock`.
- **Point events:** EARN_MULTIPLIER / TOPUP_MULTIPLIER. Trùng giờ KHÔNG cộng dồn → lấy multiplier cao nhất theo `priority`, 1 event/giao dịch. Ledger **tách 2 dòng**: base + bonus (`source=EVENT_BONUS`, `ref=event_id`). Trần `max_bonus_per_user`/`max_bonus_total`.
- **Gift wallet** lazy expiration. DIGITAL: ACTIVE→USED→EXPIRED. PHYSICAL: PENDING→CONFIRMED→SHIPPED→DELIVERED (địa chỉ → `shipping_addresses`, PII); quá hạn xác nhận → EXPIRED, KHÔNG hoàn điểm.
- **Offerwall/IAP cộng tiền:** verify TRƯỚC (S2S postback signature cho Gold; webhook + **server-side receipt validation** App Store Server Notifications v2 / Google Play RTDN cho Diamond). **Chargeback offerwall:** dòng `source=OFFERWALL_CHARGEBACK` (amount âm) → cho Gold âm = nợ, chặn chi tiêu tiếp + flag account; KHÔNG đảo vote đã cast.

---

## 9. Referral (đề xuất mặc định đã CHỐT)
- Mã mời = User ID. User mới điền khi đăng ký (optional, 1 lần, không sửa). Cả hai nhận **500 Green**.
- Referrer nhận thưởng **chỉ khi** referee verify email/SĐT (`referrals.status: PENDING → REWARDED`) — chuyển trạng thái + reward **dưới `lockUser(tx, referrerId)`** (đếm REWARDED < 50 rồi mới reward, chống vượt trần khi nhiều referee verify đồng thời).
- **500 Green referral = PA-B:** miễn trần 100/ngày (flag riêng, không cộng vào `green_earned_today`), `expires_at = now + 7 ngày` (config `referral.green_expiry_days = 7`).
- **Giới hạn lượt mời được thưởng = 50/user** (config `referral.max_rewarded = 50`).
- Chống self-referral: referrer ≠ referee; chặn cùng thiết bị/IP/SĐT đáng ngờ → `referrals.signup_ip`, `referrals.device_fingerprint` (thu lúc register), ngưỡng nghi ngờ trong `platform_config`.

---

## 10. Idempotency (đã CHỐT — thêm bảng mới)
Bảng `idempotency_keys(key PK, user_id, scope, response_json, status, created_at, expires_at)`.
- Áp cho **vote, topup/đổi Diamond→Gold, redeem deal, webhook**.
- Flow: đầu service cấp cao, **sau `lockUser`**, trong cùng transaction → `INSERT key (status=PENDING)`. Trùng (`unique_violation 23505`): đọc lại → `DONE` → trả `response_json`; còn `PENDING` → ném `409 IN_PROGRESS` (client retry). Chạy logic xong → `UPDATE status=DONE + cache response`. Insert-block + advisory lock cùng serialize race.
- Webhook IAP dùng `transaction_id` của payment provider làm key (chống replay).
- **TTL cleanup (job daily):** `DELETE WHERE expires_at < now()`. `expires_at`: vote/redeem ~24–48h; **webhook key giữ ~90d** (chống replay qua chu kỳ retry provider).

---

## 11. Auth & hạ tầng (đã CHỐT)
- **Refresh token:** bảng `refresh_tokens(id, user_id, token_hash, family_id, expires_at, revoked_at, created_at)`. Xoay vòng: mỗi lần refresh → revoke token cũ, cấp token mới **cùng `family_id`**. **Theft detection:** nhận token đã `revoked_at` (reuse) → **revoke toàn bộ family** → buộc login lại. Lưu **hash** token, không plaintext.
- **Google OAuth:** `POST /auth/google` nhận Google ID token → verify cert Google (`aud/iss/exp`) → tìm/tạo user theo email đã verify → cấp JWT pair của ta. `users.auth_provider(LOCAL|GOOGLE)`, `google_sub UNIQUE NULL`, `password_hash` **nullable**, email Google coi như verified.
- **Verify email/SĐT:** bảng `verification_tokens(id, user_id, channel(EMAIL|PHONE), purpose, token_hash, expires_at, consumed_at)`. Verify OK → set `email_verified_at`/`phone_verified_at` → kích hoạt referral REWARDED (§9). Throttle gửi OTP.
- **Rate limiting (`@nestjs/throttler`):** chặt cho `/auth/login|register`, `/verify/*` (per-IP + per-user); vừa cho `/vote`; webhook bảo vệ bằng signature + idempotency (không throttle theo user).
- **Pooling:** pgBouncer **transaction mode** → CHỈ `pg_advisory_xact_lock` (cấm advisory session-level + session state phụ thuộc connection).
- **Secret ra env** (`@nestjs/config`): JWT secret, webhook signing key, SMS/email/OAuth credential — KHÔNG để trong `platform_config` (config chỉ chứa số nghiệp vụ).
- **API versioning:** prefix `/api/v1`. Bump khi breaking.
- **Response bao:** interceptor bọc `{ data: ... }`; lỗi → `{ error: { code, message } }` qua exception filter. Mã lỗi nghiệp vụ rõ ràng: `INSUFFICIENT_BALANCE`, `CAMPAIGN_CLOSED`, `IDOL_DUPLICATE`, `GREEN_CAP_EXCEEDED`, `OUT_OF_STOCK`, `REPLAY_DETECTED`, `IN_PROGRESS`, `ALREADY_CLAIMED`…
- Mật khẩu hash **argon2**. Guard `RolesGuard` cho phân quyền USER/ADMIN. Admin action ghi tiền/đổi trạng thái → ghi `admin_audit_log` cùng transaction.

---

## 12. Schema — bảng & invariant

Bảng: `users, refresh_tokens, wallet_ledger, green_daily_counter, idempotency_keys, idols, campaigns, campaign_idols, vote_logs, partners, shop_deals, gift_wallet_items, iap_packages, daily_rewards_config, point_events, referrals, notifications, donation_receipts, platform_config`.
**Bảng bổ sung:** `verification_tokens, admin_audit_log, shipping_addresses, campaign_snapshots`.
- `donation_receipts`, `admin_audit_log`, `campaign_snapshots` **immutable** — chỉ INSERT.
- Tiền tệ cột `bigint`. `expires_at` chỉ có ý nghĩa với GREEN trong `wallet_ledger`.

**Cột/enum bổ sung:**
- `wallet_ledger.consumes_ledger_id bigint NULL` (FIFO lot Green, §4).
- `users`: `auth_provider`, `google_sub UNIQUE NULL`, `password_hash NULL`, `email_verified_at`, `phone_verified_at`, `signup_ip`, `device_fingerprint`.
- `refresh_tokens.family_id uuid`; `referrals.signup_ip inet`, `device_fingerprint text`.
- `green_daily_counter`: PK `(user_id, date)` + `checkin_claimed_at` (check-in 1 lần/ngày).
- `campaigns`: `closed_at`, `snapshotted_at`; `vote_logs.id bigserial` (tiebreak).
- `gift_wallet_items.shipping_address_id NULL` (chỉ PHYSICAL khi CONFIRMED — PII).
- enum `source` thêm: `VOTE_REVERSAL`, `OFFERWALL_CHARGEBACK`.

**Invariants — phải có test (`test/invariants/`) + job reconcile chạy prod (daily, alert khi lệch):**
1. Balance mỗi loại không âm (Gold âm CHỈ qua `OFFERWALL_CHARGEBACK` → account flagged).
2. `green_earned_today ≤ 100` (trừ flag event/referral/refund miễn trần).
3. Σ Gold phát hành ≈ doanh thu ad (đối soát).
4. Σ Diamond × 1.000 = Σ tiền nạp xác nhận webhook.
5. Quỹ campaign = `floor(Σ vote_logs GOLD × donation_ratio)`.
6. `stock_sold ≤ stock`.
7. Mỗi referee đúng 1 bản ghi `referrals`; referrer = referee bị chặn.

---

## 13. Checklist trước khi merge feature tiền tệ
- [ ] Service cấp cao mở `db.transaction`; service phụ **nhận `tx`** (không tự mở).
- [ ] `lockUser` (advisory xact) trước khi đọc balance; `FOR UPDATE` cho stock/idol row.
- [ ] Debit Green: FIFO lot, `expires_at`=lot, set `consumes_ledger_id`; tách dòng khi qua nhiều lot.
- [ ] Ghi ledger đúng `source`, `currency`, `amount` (dấu), `real_value_vnd`, `ref_type/ref_id`.
- [ ] Dùng giờ server UTC+7; `expires_at` Green tính end-of-day đúng.
- [ ] Idempotency key cho vote/topup/redeem/webhook + xử lý nhánh `23505`/`IN_PROGRESS`.
- [ ] Verify webhook/postback **trước** khi cộng Gold/Diamond; chống replay; IAP verify receipt phía store.
- [ ] Tiền là `bigint`, không float; quỹ `floor`.
- [ ] Admin action ghi `admin_audit_log` cùng transaction.
- [ ] Test đủ invariant §12.
- [ ] Endpoint có Swagger decorator đầy đủ (Flutter sinh model từ đây).
- [ ] Đúng guard USER/ADMIN.

---

## 14. Quy ước code
- Service gọi thẳng Drizzle, KHÔNG repository. Method có thể chạy trong transaction → nhận `tx: DbOrTx`.
- DTO validate bằng class-validator; reject input sai sớm.
- Lỗi nghiệp vụ → ném `BusinessException` con (có `code`), filter map ra HTTP + body chuẩn.
- Migration: chỉ thêm file mới, không sửa migration đã chạy.
- Hằng số nghiệp vụ (ratio, trần, multiplier, hạn referral, giới hạn lượt mời) → `platform_config`/config, không rải magic number.
- Hàm `normalizeName`, tính giờ UTC+7, end-of-day dùng util chung — không viết lại.

---

## 15. Phase
- **0 Foundation:** NestJS + Drizzle + Postgres, JWT + guard, schema + migration, ledger core (`LedgerService`/`GreenCounterService` + `tx`), OpenAPI, idempotency table.
- **1 Vote:** leaderboard, vote atomic, multi-campaign, đề cử idol + check trùng, thể lệ, referral, admin tối thiểu (duyệt idol / tạo campaign / chạy resolution).
- **2 Shop:** daily reward → IAP → special deals + ví quà (offerwall mock), point event banner.
- **3 Profile:** ledger API, ví quà, mã mời, đề cử của tôi, hoạt động vote, notification, information, settings.
- **4 Nâng cao:** resolution A/B/C, Vote LED, quỹ + biên lai, admin đầy đủ, offerwall thật, đối soát.
- **Native:** push (FCM/APNs) — schema/API không đổi.

---

## 16. Scheduled jobs (lazy-first, cron tối thiểu)
- **Campaign lifecycle (~1'/lần):** flip OPEN→CLOSED khi `close_at<=now()` (atomic) + snapshot. Vote trễ vẫn chặn lazy bất kể job.
- **Idempotency TTL (daily):** xoá key hết hạn (vote/redeem ~24–48h, webhook ~90d).
- **green_daily_counter prune (daily):** xoá row > 2 ngày.
- **Reconciliation (daily):** chạy invariant §12 (3,4,5 + balance) trên prod → alert khi lệch.

> KHÔNG cron cho Green expiration (lazy qua `expires_at` trong query). Cron CHỈ cho lifecycle + dọn dẹp + đối soát.