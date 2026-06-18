# CLAUDE.md — Web (React)

> Kim chỉ nam cho `fdv/web`. React phục vụ **cả Admin desktop lẫn User web**. Đọc trước khi code.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **Web là client mỏng.** Mọi business logic (số dư, điểm, tiền, resolution, trần Green…) ở **backend NestJS**. Web chỉ: gọi API → hiển thị → validate cơ bản (UX).
2. **KHÔNG tự tính tiền.** Không cộng/trừ balance ở client, không tự suy ra quỹ/điểm. Luôn lấy con số từ API. Validate client chỉ để báo lỗi sớm — backend mới là người quyết.
3. **KHÔNG tin thời gian client.** Trạng thái campaign OPEN/CLOSED, hạn Green, countdown… dựa trên dữ liệu server trả về (server time UTC+7). Countdown chỉ là hiển thị, hành động vẫn do backend chặn.
4. **Logic không viết 2 lần.** Nếu thấy mình tái hiện luật backend ở client → dừng lại, gọi API. Đổi luật chỉ sửa ở backend.
5. **Type từ OpenAPI.** Model/endpoint sinh từ Swagger backend (`/api/docs`). Không tự định nghĩa shape lệch contract.
6. **Envelope cố định.** Thành công → `{ data: ... }`; lỗi → `{ error: { code, message } }`. Luôn unwrap `.data`; map `error.code` → thông báo thân thiện (xem §12).
7. **Mọi mutation tiền tệ kèm `Idempotency-Key` (HEADER).** vote / convert-diamond / redeem deal. Sinh UUID/lần submit, disable nút khi đang gửi; retry dùng LẠI key cũ.

---

## 1. Stack & cấu trúc

- **React** (TypeScript). Share types với backend qua package chung trong monorepo (nếu monorepo).
- Data fetching: ưu tiên một lớp query (React Query/SWR) — cache + revalidate + polling.
- **Realtime phase đầu: POLLING 5–10s** (leaderboard, balance, notification). Nâng cấp WebSocket sau — đóng gói sau hook để swap không đụng UI.
- Hai khu vực rõ ràng: **User web** và **Admin desktop**, dùng chung backend & auth, tách route/layout.
- **API base `/api/v1`** (prefix backend). OpenAPI tại `/api/docs` → generate client/type.

```
web/src/
├── api/        client sinh từ OpenAPI + hooks (useVote, useWallet, useLeaderboard…)
├── features/   vote, shop, profile, admin/*
├── components/ UI dùng chung (neubrutalism)
├── lib/        format tiền/thời gian, auth token, guards
└── routes/     user/* , admin/*
```

---

## 2. Auth & phân quyền
- JWT: Access (15–30') + Refresh (xoay vòng). Interceptor: 401 → `POST /auth/refresh { refreshToken }` → retry. Lưu token an toàn; không log token.
- **Theft detection:** refresh trả `TOKEN_REUSE_DETECTED` (hoặc refresh fail) → **xoá session + buộc login lại** (không retry vô hạn).
- Endpoint: `register`, `login`, `google`, `refresh`, `logout`, `GET /auth/me`. Guard route theo role **USER/ADMIN** — nhớ: **client guard chỉ là UX**, backend mới thực thi quyền (role nằm trong access token).
- **Đăng ký:** `POST /auth/register` (email **hoặc** phone + password + displayName, `referralCode` optional = userId người giới thiệu).
- **Gmail:** `POST /auth/google { idToken, referralCode? }` — popup điền mã mời TRƯỚC khi vào app, có thể bỏ qua.
- **Verify email/SĐT (mới — gate referral):** `POST /auth/verify/request { channel: EMAIL|PHONE }` gửi OTP → màn nhập OTP → `POST /auth/verify/confirm { channel, otp }`. **Referrer + referee chỉ nhận 500 Green SAU khi referee verify** → UI nhắc verify để nhận thưởng; hiển thị trạng thái từ API, không tự suy.

---

## 3. Hiển thị tiền tệ (chỉ render, không tính)
- 3 loại: **GREEN / GOLD / DIAMOND**. `GET /wallet/balance` → `{ green, gold, diamond }`. Ledger: `GET /wallet/ledger?limit=&cursor=` (cursor pagination, xem §12).
- Green: hiển thị **countdown hết hạn** (dựa `expires_at` từng dòng ledger từ server). Nhắc "sắp hết hạn" thuần UI.
- Quy đổi hiển thị: 1 Gold = 1đ, 1 Diamond = 1.000 Gold = 1.000đ — chỉ để **show**, không tự cộng dồn balance.
- Diamond không vote trực tiếp → `POST /wallet/convert-diamond { diamonds }` + `Idempotency-Key` (một chiều, không hoàn). Refetch balance sau khi đổi.
- **Gold có thể ÂM** (clawback chargeback) → nếu balance.gold < 0, UI báo "tài khoản đang bị khoá chi tiêu" (backend chặn + flag).

---

## 4. Vote (User web)
- Leaderboard `GET /campaigns/:id/leaderboard` (poll 5–10s) → mảng `{ campaignIdolId, idolId, name, avatarUrl, totalVotes, reachedValueAt }`. Nhiều campaign song song.
- Form vote: nhập N → `POST /votes { campaignIdolId, amount }` + header `Idempotency-Key`. Response `{ greenSpent, goldSpent, newTotal, balance }` — hiển thị "Green trừ trước → Gold sau" từ response, **không tự trừ**. Refetch balance + leaderboard sau vote.
- Nút **📋 Thể lệ**: render `rules_content` của `GET /campaigns/:id` (HTML/markdown).
- Campaign `CLOSED/RESOLVED` → disable vote. Kết quả: `GET /campaigns/:id/result` → `{ campaign, snapshot[], receipt }`. **A** (đạt mốc → Vote LED) `receipt=null`; **B** (trượt) có `receipt.fundVnd` (biên lai quỹ).

## 5. Đề cử idol
- Nhập tên → `GET /idols/check?name=` real-time (debounce 300–500ms) → `{ duplicate, idol? }`.
  - `duplicate=true` → chặn, gợi ý "vote idol có sẵn".
  - Chưa có → `POST /idols/nominate { name, aliases?, avatarUrl? }` → PENDING (chờ admin). Có thể nhận lỗi `IDOL_DUPLICATE` (race) → xử như trùng.
- Danh sách idol đã duyệt: `GET /idols?search=&limit=&cursor=`. Đưa vào campaign: `POST /campaigns/:id/idols { idolId }` (user tự do; idol phải APPROVED, campaign OPEN).

## 6. Shop (User web)
- **Banner point event:** `GET /events/active` → multiplier + `endsAt` (countdown). Số bonus do backend tính (ledger tách base+bonus) — chỉ hiển thị.
- **Daily Reward:** `GET /shop/daily-reward` (cấu hình) · `POST /shop/daily-reward/claim` — 1 lần/ngày; lần 2 trả `ALREADY_CLAIMED` → disable nút khi đã nhận.
- **Special Deals:** `GET /shop/deals` · đổi `POST /shop/deals/:id/redeem` + `Idempotency-Key`. UI đọc `stock/stockSold` từ API, disable khi hết; refetch sau đổi. Lỗi: `OUT_OF_STOCK`, `DEAL_INACTIVE`, `INSUFFICIENT_BALANCE`.
- **IAP / Offer Wall:** cộng tiền do backend xác nhận qua webhook/postback — web **không tự cộng**; poll balance để thấy cập nhật.

## 7. Profile (User web)
Info cá nhân (`GET /auth/me`) · Ví (§3) · Ví Quà · Mã mời · Đề cử của tôi · Hoạt động vote · Notification · Information · Cài đặt.
- **Ví Quà:** `GET /shop/gifts` (lọc theo status). DIGITAL: `POST /shop/gifts/:id/use` (ACTIVE→USED, hiện mã/QR). PHYSICAL: `POST /shop/gifts/:id/confirm { shippingAddressId }` (PENDING→CONFIRMED) — cần địa chỉ trước: `GET/POST /shop/addresses`. UI cảnh báo **quá hạn xác nhận → EXPIRED, không hoàn điểm**.
- **Mã mời:** `GET /referrals/me` → `{ referralCode (=userId), totalInvited, totalRewarded }`. Copy mã.
- **Hoạt động vote:** `GET /votes/activity?limit=&cursor=`.
- **Notification:** `GET /notifications` (cursor) · `GET /notifications/unread-count` (badge, poll) · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all`.

---

## 8. Admin (desktop)
Layout sidebar + nội dung, mật độ cao (dashboard/bảng). Tất cả route dưới `/api/v1/admin/*`, cần role **ADMIN** (token).
- **Duyệt idol:** `POST /admin/idols/:id/approve` · `/reject`.
- **Campaign:** `POST /admin/campaigns` (tạo DRAFT — `starGoal`, `donationRatioBps` mặc định 5000=50%, `rulesContent`, `closeAt`) · `/:id/open` (DRAFT→OPEN) · `/:id/close` (đóng + snapshot) · `/:id/resolve` (chạy A/B + quỹ + biên lai) · `/:id/reverse-votes` (hủy → hoàn vote).
- `star_goal` không cho sửa sau OPEN (disable theo state từ API). `donation_ratio` là **basis points** (5000 = 0.5) — UI nhập % rồi ×100.
- Đầy đủ (Phase 4): shop/deals/stock/partners/IAP, point event config, đơn physical, đối soát, Information, quản lý user/gian lận/gỡ idol.
- Mọi hành động ghi tiền/đổi trạng thái → gọi API; admin web không tự tính.

---

## 9. UI — Flat Neubrutalism
- Hard shadow offset **4px không blur**, viền đen **2–3px**, tương phản cao, phẳng, bo góc nhẹ.
- Màu: vàng `#FFD60A`, xanh dương `#3B82F6`, xanh lá `#22C55E`, hồng `#FB7185`, nền kem `#FAF7F0`.
- Font: **Space Grotesk** (tiêu đề) / **Inter** (nội dung) / **JetBrains Mono** (số liệu).
- Micro-interaction: hover/press làm khối "lún" (dịch theo offset shadow).
- User web mô phỏng app: max-width ~480px khung mobile khi cần; Admin tận dụng full desktop.

---

## 10. Checklist trước khi merge UI tiền tệ
- [ ] Không có phép tính balance/quỹ/điểm ở client — chỉ render số từ API.
- [ ] Unwrap `{ data }`; map `error.code` → thông báo (§12). Bắt **429** (rate limit) → báo "thử lại sau".
- [ ] `Idempotency-Key` (header) cho vote/convert-diamond/redeem; disable nút khi submit; retry dùng lại key cũ.
- [ ] Interceptor 401 → refresh→retry; `TOKEN_REUSE_DETECTED`/refresh fail → xoá session + login lại.
- [ ] Countdown/trạng thái dựa server time, không `Date.now()` client để quyết định nghiệp vụ.
- [ ] Refetch sau mutation (balance, stock, leaderboard, notification, gifts).
- [ ] Cursor pagination cho ledger/notifications/vote-activity (`{ items, nextCursor }`).
- [ ] Loading/empty/error state đầy đủ cho mọi list (poll có thể trễ).

---

## 11. Phase
- **0:** scaffold, auth, api client từ OpenAPI.
- **1 Vote:** leaderboard, form vote, đề cử idol + check trùng, thể lệ, referral đăng ký, admin tối thiểu.
- **2 Shop:** daily reward → IAP → special deals + ví quà (offerwall mock), banner point event.
- **3 Profile:** ví+ledger, ví quà, mã mời, đề cử của tôi, hoạt động vote, notification, information, settings.
- **4 Nâng cao:** màn resolution A/B/C, Vote LED, biên lai quỹ, admin đầy đủ + đối soát.

---

## 12. API surface (tóm tắt — chi tiết & type ở OpenAPI `/api/docs`)

> Base `/api/v1`. Mọi response bọc `{ data }` (lỗi `{ error: { code, message } }`). 🔒 = cần Bearer, 🔑 = cần header `Idempotency-Key`, 👑 = role ADMIN.

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
| Admin 👑 | `POST /admin/idols/:id/approve` · `/reject` · `POST /admin/campaigns` · `/:id/open` · `/:id/close` · `/:id/resolve` · `/:id/reverse-votes` |

**Cursor pagination:** query `?limit=&cursor=` → `{ items: [...], nextCursor: string | null }` (ledger, notifications, vote activity, idols).

**Mã lỗi → gợi ý hiển thị:**
`INSUFFICIENT_BALANCE` (không đủ điểm) · `GREEN_CAP_EXCEEDED` (vượt trần Green/ngày) · `CAMPAIGN_NOT_OPEN` / `CAMPAIGN_CLOSED` · `IDOL_DUPLICATE` · `OUT_OF_STOCK` · `DEAL_INACTIVE` · `ALREADY_CLAIMED` (đã điểm danh) · `IN_PROGRESS` (đang xử lý — retry) · `REPLAY_DETECTED` · `SELF_REFERRAL` / `REFERRAL_LIMIT` · `INVALID_CREDENTIALS` · `TOKEN_INVALID` / `TOKEN_REUSE_DETECTED` (→ login lại) · `ACCOUNT_FLAGGED` (khoá chi tiêu) · `INVALID_STATE` · `VALIDATION_ERROR` · `FORBIDDEN` / `NOT_FOUND`. HTTP **429** = rate limit.
