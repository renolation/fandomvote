# CLAUDE.md — Backend (NestJS + Drizzle)

> Nguồn chân lý cho `fdv/backend`. Đọc hết trước khi chạm code. Backend là **nơi duy nhất** chứa business logic của FandomVote (FDV). Web/Mobile chỉ gọi API.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **TẤT CẢ business logic ở đây.** Không tin client về số dư, điểm, tiền, thời gian.
2. **Ví = ledger.** KHÔNG có cột `balance`. Balance = `SUM(amount)` các dòng `wallet_ledger`. Mọi thay đổi ví = **thêm 1 dòng**; không UPDATE/DELETE dòng cũ.
3. **Thao tác tiền tệ ATOMIC.** Bọc `db.transaction` + `FOR UPDATE`. Lỗi 1 bước → rollback toàn bộ.
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

- **GREEN:** trần theo `green_daily_counter.green_earned_today` (earned/ngày, không phải balance). Lazy expiration — KHÔNG cron. Balance Green = `SUM(amount) WHERE currency=GREEN AND (expires_at IS NULL OR expires_at > now())`.
- **GOLD:** liability. Chỉ cộng sau S2S postback verify.
- **DIAMOND:** đổi xuống Gold một chiều (`source=DIAMOND_TO_GOLD`), không hoàn. KHÔNG vote trực tiếp. Chỉ cộng sau webhook + chống replay theo `transaction_id` unique.

---

## 5. Vote (ATOMIC)

Chỉ tiêu Green + Gold. Thứ tự trừ: **GREEN trước → GOLD sau**.

```
cast(userId, dto{campaignIdolId, amount N, idempotencyKey}):
  0. Idempotency: key đã xử lý → trả kết quả cũ (xem §10)
  db.transaction(tx):
    1. Campaign OPEN? (giờ server)
    2. Lock + tính balance: Green-chưa-hết-hạn + Gold >= N ? (FOR UPDATE)
    3. ledger.debit(tx, ...) Green trước (FIFO theo expires_at) → hết Green trừ Gold
    4. UPDATE campaign_idols.total_votes += N, cập nhật reached_peak_at
    5. INSERT vote_logs(currency, amount, real_value_vnd, running_total, created_at)
    rollback nếu bất kỳ bước lỗi
```
- Vote Green: `real_value_vnd = 0` (không vào quỹ). Vote Gold: `real_value_vnd = amount`.
- `vote_logs` BẮT BUỘC ghi rõ `currency`. `running_total` phục vụ luật hòa first-to-reach.
- Vote không hoàn, trừ khi campaign hủy / idol gỡ.

---

## 6. Campaign & Resolution

State: `DRAFT → OPEN → CLOSED → RESOLVING → RESOLVED → ARCHIVED`. Nhiều campaign OPEN song song, độc lập.
- `star_goal` chốt ở DRAFT, KHÔNG sửa sau OPEN.
- CLOSED → snapshot bảng xếp hạng; mọi xử lý dựa trên snapshot. Chỉ xét **idol top 1** vs goal.
- **Luật hòa first-to-reach:** cùng điểm → idol chạm mức đó trước (timestamp `running_total` sớm hơn) thắng.
- **A** đạt mốc → Vote LED (Phase 4). **B** trượt → `Quỹ = Σ GOLD-đã-vote-mọi-idol × 1đ × donation_ratio(0.5)`, Green KHÔNG tính, sinh `donation_receipts` immutable. **C** thư an ủi fan hạng 2+ (song song A/B).

---

## 7. Idol
Hai tầng: kho idol (`idols.name_normalized UNIQUE`, `aliases`) ↔ `campaign_idols` (điểm riêng/campaign).
- Tạo idol mới → admin duyệt (PENDING/APPROVED/REJECTED). Đưa idol đã duyệt vào campaign → user tự do.
- Check trùng real-time theo `name_normalized` (lowercase + bỏ dấu + trim + collapse spaces — một hàm chung).

---

## 8. Shop & Events
- **Redeem deal (ATOMIC):** lock row → check `stock_sold < stock` → trừ điểm (GOLD/DIAMOND, 1 loại/deal) → `stock_sold += 1` → tạo `gift_wallet_item` (sinh `expires_at` từ `validity_days`) → ledger `source=PURCHASE`. Invariant `stock_sold <= stock`.
- **Point events:** EARN_MULTIPLIER / TOPUP_MULTIPLIER. Trùng giờ KHÔNG cộng dồn → lấy multiplier cao nhất theo `priority`, 1 event/giao dịch. Ledger **tách 2 dòng**: base + bonus (`source=EVENT_BONUS`, `ref=event_id`). Trần `max_bonus_per_user`/`max_bonus_total`.
- **Gift wallet** lazy expiration. DIGITAL: ACTIVE→USED→EXPIRED. PHYSICAL: PENDING→CONFIRMED→SHIPPED→DELIVERED; quá hạn xác nhận → EXPIRED, KHÔNG hoàn điểm.

---

## 9. Referral (đề xuất mặc định đã CHỐT)
- Mã mời = User ID. User mới điền khi đăng ký (optional, 1 lần, không sửa). Cả hai nhận **500 Green**.
- Referrer nhận thưởng **chỉ khi** referee verify email/SĐT (`referrals.status: PENDING → REWARDED`).
- **500 Green referral = PA-B:** miễn trần 100/ngày (flag riêng, không cộng vào `green_earned_today`), `expires_at = now + 7 ngày` (config `referral.green_expiry_days = 7`).
- **Giới hạn lượt mời được thưởng = 50/user** (config `referral.max_rewarded = 50`).
- Chống self-referral: referrer ≠ referee; chặn cùng thiết bị/IP/SĐT đáng ngờ.

---

## 10. Idempotency (đã CHỐT — thêm bảng mới)
Bảng `idempotency_keys(key PK, user_id, scope, response_json, status, created_at, expires_at)`.
- Áp cho **vote, topup/đổi Diamond→Gold, redeem deal, webhook**.
- Flow: đầu service cấp cao, trong cùng transaction → check key tồn tại: có & DONE → trả `response_json`; chưa có → insert (status=PENDING) → chạy logic → cập nhật DONE + cache response. Unique constraint trên `key` chống double-spend khi race.
- Webhook IAP dùng `transaction_id` của payment provider làm key (chống replay).

---

## 11. Auth & hạ tầng (đã CHỐT)
- **Refresh token:** bảng `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, created_at)`. Xoay vòng: mỗi lần refresh → revoke token cũ, cấp token mới. Lưu **hash** token, không lưu plaintext.
- **API versioning:** prefix `/api/v1`. Bump khi breaking.
- **Response bao:** interceptor bọc `{ data: ... }`; lỗi → `{ error: { code, message } }` qua exception filter. Mã lỗi nghiệp vụ rõ ràng: `INSUFFICIENT_BALANCE`, `CAMPAIGN_CLOSED`, `IDOL_DUPLICATE`, `GREEN_CAP_EXCEEDED`, `OUT_OF_STOCK`, `REPLAY_DETECTED`…
- Mật khẩu hash **argon2**. Guard `RolesGuard` cho phân quyền USER/ADMIN.

---

## 12. Schema — bảng & invariant

Bảng: `users, refresh_tokens, wallet_ledger, green_daily_counter, idempotency_keys, idols, campaigns, campaign_idols, vote_logs, partners, shop_deals, gift_wallet_items, iap_packages, daily_rewards_config, point_events, referrals, notifications, donation_receipts, platform_config`.
- `donation_receipts` **immutable** — chỉ INSERT.
- Tiền tệ cột `bigint`. `expires_at` chỉ có ý nghĩa với GREEN trong `wallet_ledger`.

**Invariants — phải có test (`test/invariants/`):**
1. Balance mỗi loại không âm.
2. `green_earned_today ≤ 100` (trừ flag event/referral miễn trần).
3. Σ Gold phát hành ≈ doanh thu ad (đối soát).
4. Σ Diamond × 1.000 = Σ tiền nạp xác nhận webhook.
5. Quỹ campaign = Σ `vote_logs` GOLD × `donation_ratio`.
6. `stock_sold ≤ stock`.
7. Mỗi referee đúng 1 bản ghi `referrals`; referrer = referee bị chặn.

---

## 13. Checklist trước khi merge feature tiền tệ
- [ ] Service cấp cao mở `db.transaction`; service phụ **nhận `tx`** (không tự mở).
- [ ] `FOR UPDATE` khi đọc balance/stock trước khi trừ.
- [ ] Ghi ledger đúng `source`, `currency`, `amount` (dấu), `real_value_vnd`, `ref_type/ref_id`.
- [ ] Dùng giờ server UTC+7; `expires_at` Green tính end-of-day đúng.
- [ ] Idempotency key cho vote/topup/redeem/webhook.
- [ ] Verify webhook/postback **trước** khi cộng Gold/Diamond; chống replay.
- [ ] Tiền là `bigint`, không float.
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