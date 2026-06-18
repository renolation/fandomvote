# FDV Backend (NestJS + Drizzle)

Backend FandomVote — **nơi duy nhất** chứa business logic. Nguồn chân lý: [`backend.CLAUDE.md`](./backend.CLAUDE.md).

## Stack
NestJS · Drizzle ORM (SQL-first) · PostgreSQL · JWT tự viết (argon2) · OpenAPI/Swagger.

## Chạy local

```bash
cp .env.example .env          # chỉnh secret nếu cần
docker compose up -d          # Postgres :5432
npm install
npm run db:generate           # sinh migration từ schema (đã có sẵn 0000_*)
npm run db:migrate            # áp migration
npm run db:seed               # seed platform_config + daily_rewards
npm run start:dev             # http://localhost:3000/api/v1 — Swagger /api/docs
```

## Lệnh
| Lệnh | Mô tả |
|---|---|
| `npm run start:dev` | dev watch |
| `npm run build` | build production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | drizzle-kit generate (KHÔNG sửa migration đã chạy) |
| `npm run db:migrate` | áp migration |
| `npm run db:seed` | seed config |

## Cấu trúc
`src/db` (schema 1 file/bảng + provider + migrate/seed) · `src/config` · `src/common` (guards/filters/interceptors/decorators/utils) · `src/modules/*` (auth, wallet, vote, campaign, idol, shop, events, referral, webhook, notification, admin, platform-config, idempotency, audit, scheduled).

## Nguyên tắc bất di (xem backend.CLAUDE.md)
- Ví = ledger append-only, balance = `SUM(amount)`, KHÔNG cột balance.
- Thao tác tiền ATOMIC: `db.transaction` + `lockUser` (advisory xact) + `FOR UPDATE` cho stock/idol.
- Green FIFO lot-attribution (`consumes_ledger_id`) — chống balance âm khi lot hết hạn.
- Idempotency `ON CONFLICT DO NOTHING` (vote/topup/redeem/webhook).
- Tiền = `bigint`, cấm float; quỹ làm tròn `floor`. Giờ server UTC+7.
- Verify (HMAC/OAuth) TRƯỚC khi cộng tiền; chống replay theo `transaction_id`.

## Đã verify E2E (Postgres thật)
register/login · Google OAuth (endpoint) · referral PENDING→REWARDED (cả hai +500 Green khi verify) · vote atomic Green→Gold FIFO · idempotency replay · Diamond→Gold · webhook IAP/offerwall HMAC + replay + chargeback · daily reward 1 lần/ngày · campaign close+snapshot · resolution A/B + quỹ floor + biên lai immutable.

## TODO
- Test suite `test/invariants/` (invariant §12) — chưa viết.
- Provider thật: gửi OTP email/SMS, IAP receipt validation (App Store/Play).
