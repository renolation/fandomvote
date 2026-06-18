# FDV Backend — NestJS Implementation

Nguồn chân lý: `backend/backend.CLAUDE.md`. Style: modular feature-based, no repository, tx tường minh, ledger append-only.

## Tiến độ

- [x] **Scaffold** — package.json, tsconfig, nest-cli, drizzle.config, docker-compose, .env
- [x] **DB layer** — enums + 23 schema tables + index, drizzle provider/module, DbOrTx type
- [x] **Config** — app/jwt/database config
- [x] **Common** — exceptions, filter, interceptors, guards, decorators, pipes, dto, utils (time/money/normalize/wallet-lock)
- [x] **Auth** — register(+referral), login, refresh rotation+theft, google OAuth, verify email/phone
- [x] **Wallet** — LedgerService (credit/debit FIFO Green), GreenCounterService, balance/history
- [x] **Vote** — cast atomic (lock→idempotency→FIFO debit→vote_logs), reversal
- [x] **Campaign** — CRUD, state machine, leaderboard, snapshot, resolution CAS
- [x] **Idol** — nominate, real-time dup-check, admin approve, add-to-campaign
- [x] **Referral** — code=userId, PENDING→REWARDED under lock, anti-fraud
- [x] **Shop** — redeem deal atomic, gift-wallet, daily-reward
- [x] **Events** — point events (highest multiplier, bonus cap)
- [x] **Webhook** — IAP (Diamond), offerwall postback (Gold) verify+replay, chargeback
- [x] **Notification** — in-app, badge, mark-read
- [x] **Admin** — gom controller + RolesGuard(ADMIN) + audit log
- [x] **Scheduled jobs** — campaign lifecycle, idempotency TTL, counter prune, reconcile
- [x] **Seed** — platform_config, daily_rewards
- [ ] **Tests** — invariants §12 (follow-up)

## Lệnh
- Dev DB: `docker compose up -d`
- Migrate: `npm run db:generate && npm run db:migrate`
- Seed: `npm run db:seed`
- Run: `npm run start:dev` → Swagger `/api/docs`
</content>
