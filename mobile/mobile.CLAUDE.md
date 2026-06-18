# CLAUDE.md — Mobile (Flutter / Dart)

> Kim chỉ nam cho `fdv/mobile`. App **user** (Vote · Shop · Profile). Đọc trước khi code.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **Flutter là client mỏng.** Mọi business logic (số dư, điểm, tiền, resolution, trần Green, quỹ…) ở **backend NestJS**. App chỉ: gọi API → hiển thị → validate cơ bản (UX).
2. **KHÔNG tự tính tiền.** Không cộng/trừ balance, không tự suy quỹ/điểm/stock. Mọi con số lấy từ API. Validate ở Dart chỉ để báo lỗi sớm — backend quyết định cuối cùng.
3. **KHÔNG tin thời gian thiết bị.** Campaign OPEN/CLOSED, hạn Green, countdown… dựa dữ liệu server (UTC+7). `DateTime.now()` của máy KHÔNG được dùng để quyết định nghiệp vụ — chỉ để animate countdown dựa mốc server.
4. **KHÔNG share code TS với web.** Logic không viết lại ở Dart. Nếu thấy mình tái hiện luật backend → dừng, gọi API.
5. **Model sinh từ OpenAPI.** Generate model Dart từ Swagger backend (`/api/docs`). KHÔNG viết tay model lệch contract; regenerate khi API đổi.
6. **Envelope cố định.** Thành công → `{ data: ... }`; lỗi → `{ error: { code, message } }`. Interceptor unwrap `.data`; map `error.code` → thông báo (xem §12).
7. **Mọi mutation tiền tệ kèm `Idempotency-Key` (HEADER).** vote / convert-diamond / redeem deal. Sinh `uuid` mỗi lần submit, disable nút khi đang gửi; retry dùng LẠI key cũ (chống double-tap).

---

## 1. Stack & cấu trúc

- **Flutter (Dart)**. Model + API client **generate từ OpenAPI** (vd openapi-generator / swagger_parser).
- State management nhất quán toàn app (Riverpod/Bloc — chọn 1, dùng xuyên suốt).
- **Realtime phase đầu: POLLING 5–10s** (leaderboard, balance, notification). Đóng gói trong repository để sau swap WebSocket không đụng UI.
- Network layer tập trung: interceptor gắn JWT, tự refresh khi 401, unwrap `{ data }`, map lỗi nghiệp vụ backend.
- **API base `/api/v1`** (prefix backend). OpenAPI tại `/api/docs` → generate model + client Dart.

```
mobile/lib/
├── api/         model + client generate từ OpenAPI
├── core/        network (dio+interceptor), auth, format tiền/thời gian, theme
├── features/    vote/, shop/, profile/  (mỗi feature: data/ domain(thin)/ presentation/)
└── shared/      widget neubrutalism dùng chung
```

---

## 2. Auth & đăng ký
- JWT: Access (15–30') + Refresh (xoay vòng). Interceptor: 401 → `POST /auth/refresh { refreshToken }` → retry. Lưu token bằng secure storage; không log token.
- **Theft detection:** refresh trả `TOKEN_REUSE_DETECTED` (hoặc refresh fail) → **xoá secure storage + về màn login** (không retry vô hạn).
- Endpoint: `register`, `login`, `google`, `refresh`, `logout`, `GET /auth/me`.
- **Đăng ký email/SĐT:** `POST /auth/register` (email **hoặc** phone + password + displayName, `referralCode` optional = userId).
- **Gmail:** `POST /auth/google { idToken, referralCode? }` — popup điền mã mời TRƯỚC khi vào app, có thể bỏ qua.
- **Verify email/SĐT (gate referral):** `POST /auth/verify/request { channel: EMAIL|PHONE }` → màn nhập OTP → `POST /auth/verify/confirm { channel, otp }`. **Referrer + referee chỉ nhận 500 Green SAU khi referee verify** → UI nhắc verify; hiển thị trạng thái từ API.

---

## 3. Điều hướng & layout
- Bottom tab: **🗳️ Vote · 🛒 Shop · 👤 Profile**.
- Full-screen: header cố định + nội dung cuộn + tab bar dưới. Tôn trọng **safe area**. Max-width ~480px khi chạy trên desktop/web.

---

## 4. Hiển thị tiền tệ (chỉ render)
- 3 loại: **GREEN / GOLD / DIAMOND**. `GET /wallet/balance` → `{ green, gold, diamond }`. Ledger: `GET /wallet/ledger?limit=&cursor=` (cursor pagination, §12).
- Green: **countdown hết hạn** dựa `expires_at` từng dòng ledger; cảnh báo "sắp hết hạn" thuần UI.
- Hiển thị quy đổi (1 Gold=1đ, 1 Diamond=1.000 Gold) chỉ để show, không tự cộng dồn.
- Diamond không vote trực tiếp → `POST /wallet/convert-diamond { diamonds }` + `Idempotency-Key` (một chiều, không hoàn). Refetch balance sau đổi.
- **Gold có thể ÂM** (chargeback clawback) → nếu balance.gold < 0, UI báo "tài khoản đang bị khoá chi tiêu".

---

## 5. Vote
- Leaderboard `GET /campaigns/:id/leaderboard` (poll 5–10s) → `[{ campaignIdolId, idolId, name, avatarUrl, totalVotes, reachedValueAt }]`. Nhiều campaign song song.
- Form vote: nhập N → `POST /votes { campaignIdolId, amount }` + header `Idempotency-Key` (uuid). Disable nút khi gửi. Response `{ greenSpent, goldSpent, newTotal, balance }` → hiển thị "Green trừ trước → Gold sau", **không tự trừ**. Refetch balance + leaderboard.
- Nút **📋 Thể lệ**: render `rules_content` của `GET /campaigns/:id`.
- Campaign `CLOSED/RESOLVED` → khóa vote. Kết quả `GET /campaigns/:id/result` → `{ campaign, snapshot[], receipt }`: **A** (đạt mốc → Vote LED) `receipt=null`; **B** (trượt) có `receipt.fundVnd`.

## 6. Đề cử idol
- Nhập tên → `GET /idols/check?name=` real-time (debounce): `{ duplicate, idol? }` → trùng chặn + gợi ý vote; chưa có → `POST /idols/nominate { name, aliases?, avatarUrl? }` → PENDING. Có thể nhận `IDOL_DUPLICATE` (race) → xử như trùng.
- Danh sách duyệt: `GET /idols?search=`. Đưa vào campaign: `POST /campaigns/:id/idols { idolId }` (idol APPROVED, campaign OPEN).

## 7. Shop
- **Banner point event:** `GET /events/active` → multiplier + `endsAt` (countdown). Số bonus do backend tính — chỉ hiển thị.
- **Daily Reward:** `GET /shop/daily-reward` · `POST /shop/daily-reward/claim` — 1 lần/ngày; lần 2 → `ALREADY_CLAIMED` → disable.
- **Special Deals:** `GET /shop/deals` · `POST /shop/deals/:id/redeem` + `Idempotency-Key`. Đọc `stock/stockSold` từ server, disable khi hết, refetch sau đổi. Lỗi: `OUT_OF_STOCK`, `DEAL_INACTIVE`, `INSUFFICIENT_BALANCE`.
- **IAP**: dùng store IAP; Diamond chỉ cộng **sau webhook backend xác nhận** — app KHÔNG tự cộng, mà poll `GET /wallet/balance` tới khi thấy cập nhật.
- **Offer Wall / video**: Gold chỉ cộng sau S2S postback verify ở backend — app không cộng theo SDK báo.

## 8. Profile
Info cá nhân (`GET /auth/me`: avatar, tên, fandom) · Ví (§4) · **Ví Quà** · Mã mời · Đề cử của tôi · Hoạt động vote · Notification · Information · Cài đặt.
- **Ví Quà:** `GET /shop/gifts`. DIGITAL: `POST /shop/gifts/:id/use` (ACTIVE→USED, hiện mã/QR). PHYSICAL: `POST /shop/gifts/:id/confirm { shippingAddressId }` (PENDING→CONFIRMED) — cần `GET/POST /shop/addresses` trước. Physical quá hạn xác nhận → EXPIRED, **không hoàn điểm** — UI cảnh báo trước hạn.
- **Mã mời:** `GET /referrals/me` → `{ referralCode (=userId), totalInvited, totalRewarded }`.
- **Hoạt động vote:** `GET /votes/activity?limit=&cursor=`.
- **Notification:** `GET /notifications` (cursor) · `GET /notifications/unread-count` (badge, poll) · `PATCH /notifications/:id/read` · `/notifications/read-all`. Phase native: push FCM/APNs (schema/API không đổi).

---

## 9. UI — Flat Neubrutalism
- Hard shadow offset **4px không blur**, viền đen **2–3px**, tương phản cao, phẳng, bo góc nhẹ.
- Màu: vàng `#FFD60A`, xanh dương `#3B82F6`, xanh lá `#22C55E`, hồng `#FB7185`, nền kem `#FAF7F0`.
- Font: **Space Grotesk** (tiêu đề) / **Inter** (nội dung) / **JetBrains Mono** (số liệu).
- Micro-interaction: press làm khối "lún" (dịch theo offset shadow). Đóng gói thành widget shared tái dùng.

---

## 10. Checklist trước khi merge màn tiền tệ
- [ ] Không có phép tính balance/quỹ/điểm/stock ở Dart — chỉ render số từ API.
- [ ] Model khớp OpenAPI (đã regenerate sau khi API đổi); interceptor unwrap `{ data }`, map `error.code` (§12), bắt **429** → "thử lại sau".
- [ ] `Idempotency-Key` (header) cho vote/convert-diamond/redeem; disable nút khi submitting; retry dùng lại key cũ.
- [ ] 401 → refresh→retry; `TOKEN_REUSE_DETECTED`/refresh fail → xoá secure storage + về login.
- [ ] IAP/offerwall: chờ backend xác nhận (webhook/postback) mới hiển thị cộng — không tin SDK/store client.
- [ ] Countdown/trạng thái theo mốc server, không dùng giờ máy để quyết nghiệp vụ.
- [ ] Refetch sau mutation (balance, stock, leaderboard, ví quà, notification). Cursor pagination (`{ items, nextCursor }`) cho ledger/notifications/vote-activity.
- [ ] Loading/empty/error + safe area cho mọi màn.

---

## 11. Phase
- **0:** scaffold Flutter, auth, generate API client từ OpenAPI.
- **1 Vote:** leaderboard, form vote, đề cử idol + check trùng, thể lệ, referral đăng ký.
- **2 Shop:** daily reward → IAP → special deals + ví quà (offerwall mock), banner point event.
- **3 Profile:** ví+ledger, ví quà, mã mời, đề cử của tôi, hoạt động vote, notification, information, settings.
- **4 Nâng cao:** màn resolution A/B/C, Vote LED, biên lai quỹ.
- **Native:** hoàn thiện app, push notification FCM/APNs.

---

## 12. API surface (tóm tắt — chi tiết & type ở OpenAPI `/api/docs`)

> Base `/api/v1`. Response bọc `{ data }` (lỗi `{ error: { code, message } }`). 🔒 = cần Bearer, 🔑 = cần header `Idempotency-Key`. (App là user-only — không gọi `/admin/*`.)

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /auth/register` · `/login` · `/google` · `/refresh` · `/logout` 🔒 · `GET /auth/me` 🔒 · `POST /auth/verify/request` 🔒 · `/auth/verify/confirm` 🔒 |
| Wallet | `GET /wallet/balance` 🔒 · `GET /wallet/ledger` 🔒 · `POST /wallet/convert-diamond` 🔒🔑 |
| Vote | `POST /votes` 🔒🔑 · `GET /votes/activity` 🔒 |
| Campaign | `GET /campaigns` · `/campaigns/:id` · `/campaigns/:id/leaderboard` · `/campaigns/:id/result` · `POST /campaigns/:id/idols` 🔒 |
| Idol | `GET /idols` · `/idols/check` · `/idols/:id` · `POST /idols/nominate` 🔒 |
| Referral | `GET /referrals/me` 🔒 |
| Shop | `GET /shop/deals` · `POST /shop/deals/:id/redeem` 🔒🔑 · `GET /shop/daily-reward` · `POST /shop/daily-reward/claim` 🔒 · `GET /shop/gifts` 🔒 · `POST /shop/gifts/:id/use` 🔒 · `/shop/gifts/:id/confirm` 🔒 · `GET/POST /shop/addresses` 🔒 |
| Events | `GET /events/active` |
| Notification | `GET /notifications` 🔒 · `/notifications/unread-count` 🔒 · `PATCH /notifications/:id/read` 🔒 · `/notifications/read-all` 🔒 |

**Cursor pagination:** query `?limit=&cursor=` → `{ items: [...], nextCursor: string | null }` (ledger, notifications, vote activity, idols).

**Mã lỗi → gợi ý hiển thị:**
`INSUFFICIENT_BALANCE` (không đủ điểm) · `GREEN_CAP_EXCEEDED` (vượt trần Green/ngày) · `CAMPAIGN_NOT_OPEN` / `CAMPAIGN_CLOSED` · `IDOL_DUPLICATE` · `OUT_OF_STOCK` · `DEAL_INACTIVE` · `ALREADY_CLAIMED` (đã điểm danh) · `IN_PROGRESS` (đang xử lý — retry) · `REPLAY_DETECTED` · `SELF_REFERRAL` / `REFERRAL_LIMIT` · `INVALID_CREDENTIALS` · `TOKEN_INVALID` / `TOKEN_REUSE_DETECTED` (→ login lại) · `ACCOUNT_FLAGGED` (khoá chi tiêu) · `INVALID_STATE` · `VALIDATION_ERROR` · `NOT_FOUND`. HTTP **429** = rate limit.
