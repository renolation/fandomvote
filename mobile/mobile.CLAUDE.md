# CLAUDE.md — Mobile (Flutter / Dart)

> Kim chỉ nam cho `fdv/mobile`. App **user** (Vote · Shop · Profile). Đọc trước khi code.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **Flutter là client mỏng.** Mọi business logic (số dư, điểm, tiền, resolution, trần Green, quỹ…) ở **backend NestJS**. App chỉ: gọi API → hiển thị → validate cơ bản (UX).
2. **KHÔNG tự tính tiền.** Không cộng/trừ balance, không tự suy quỹ/điểm/stock. Mọi con số lấy từ API. Validate ở Dart chỉ để báo lỗi sớm — backend quyết định cuối cùng.
3. **KHÔNG tin thời gian thiết bị.** Campaign OPEN/CLOSED, hạn Green, countdown… dựa dữ liệu server (UTC+7). `DateTime.now()` của máy KHÔNG được dùng để quyết định nghiệp vụ — chỉ để animate countdown dựa mốc server.
4. **KHÔNG share code TS với web.** Logic không viết lại ở Dart. Nếu thấy mình tái hiện luật backend → dừng, gọi API.
5. **Model sinh từ OpenAPI.** Generate model Dart từ Swagger backend. KHÔNG viết tay model lệch contract; regenerate khi API đổi.

---

## 1. Stack & cấu trúc

- **Flutter (Dart)**. Model + API client **generate từ OpenAPI** (vd openapi-generator / swagger_parser).
- State management nhất quán toàn app (Riverpod/Bloc — chọn 1, dùng xuyên suốt).
- **Realtime phase đầu: POLLING 5–10s** (leaderboard, balance, notification). Đóng gói trong repository để sau swap WebSocket không đụng UI.
- Network layer tập trung: interceptor gắn JWT, tự refresh khi 401, map lỗi nghiệp vụ backend.

```
mobile/lib/
├── api/         model + client generate từ OpenAPI
├── core/        network (dio+interceptor), auth, format tiền/thời gian, theme
├── features/    vote/, shop/, profile/  (mỗi feature: data/ domain(thin)/ presentation/)
└── shared/      widget neubrutalism dùng chung
```

---

## 2. Auth & đăng ký
- JWT: Access (15–30') + Refresh (xoay vòng). Interceptor tự refresh, retry. Lưu token bằng secure storage; không log token.
- Đăng ký email/SĐT: ô nhập **mã mời** (= User ID người giới thiệu) trong form, optional.
- Đăng ký Gmail: **popup điền mã mời TRƯỚC khi vào app**, có thể bỏ qua.
- Referrer chỉ nhận thưởng khi user mới verify email/SĐT — app chỉ hiển thị trạng thái từ API.

---

## 3. Điều hướng & layout
- Bottom tab: **🗳️ Vote · 🛒 Shop · 👤 Profile**.
- Full-screen: header cố định + nội dung cuộn + tab bar dưới. Tôn trọng **safe area**. Max-width ~480px khi chạy trên desktop/web.

---

## 4. Hiển thị tiền tệ (chỉ render)
- 3 loại: **GREEN / GOLD / DIAMOND**, lấy balance + ledger từ API.
- Green: **countdown hết hạn** dựa `expires_at` server trả; cảnh báo "sắp hết hạn" thuần UI.
- Hiển thị quy đổi (1 Gold=1đ, 1 Diamond=1.000 Gold) chỉ để show, không tự tính dồn.
- Diamond không vote trực tiếp → UI dẫn đổi sang Gold (gọi API), không tự đổi ở client.

---

## 5. Vote
- Leaderboard mỗi campaign (poll 5–10s). Nhiều campaign song song, độc lập.
- Form vote: nhập N → gọi API kèm **idempotency key** (uuid) chống double-tap. Disable nút khi đang gửi.
- Hiển thị minh bạch "Green trừ trước → Gold sau" — **không tự trừ**, để backend xử lý atomic.
- Nút **📋 Thể lệ**: render `rules_content` campaign đang xem (từ API).
- Campaign CLOSED/RESOLVED → khóa vote, hiển thị kết quả/biên lai từ API.

## 6. Đề cử idol
- Nhập tên → API check trùng **real-time** (`name_normalized`): trùng → chặn + gợi ý vote idol có sẵn; chưa có → form đề cử → PENDING (chờ admin).
- Đưa idol đã duyệt vào campaign: user tự do, không cần duyệt.

## 7. Shop
- Banner point event (countdown) đầu trang · Daily Reward · Offer Wall · IAP · Special Deals · icon Ví Quà (dẫn sang Profile).
- **IAP**: dùng store IAP; Diamond chỉ cộng **sau webhook backend xác nhận** — app KHÔNG tự cộng Diamond sau khi store báo thành công, mà chờ/poll trạng thái từ backend.
- **Offer Wall / video**: Gold chỉ cộng sau S2S postback verify ở backend — app không cộng theo SDK báo.
- Đổi Special Deal: API atomic; hiển thị stock từ server, disable khi hết, refetch sau đổi.

## 8. Profile
Info cá nhân (avatar, tên, fandom) · Ví (Green countdown/Gold/Diamond + ledger) · **Ví Quà** (DIGITAL: ACTIVE/USED/EXPIRED hiện mã/QR+hạn; PHYSICAL: PENDING→CONFIRMED→SHIPPED→DELIVERED) · Mã mời (=User ID, copy, thống kê) · Đề cử của tôi · Hoạt động vote · Notification in-app · Information (contact) · Cài đặt.
- Physical quá hạn xác nhận → EXPIRED, **không hoàn điểm** — UI cảnh báo rõ trước hạn.
- Notification: poll, badge chưa đọc, mark-as-read qua API. Phase native: thêm push FCM/APNs (schema/API không đổi).

---

## 9. UI — Flat Neubrutalism
- Hard shadow offset **4px không blur**, viền đen **2–3px**, tương phản cao, phẳng, bo góc nhẹ.
- Màu: vàng `#FFD60A`, xanh dương `#3B82F6`, xanh lá `#22C55E`, hồng `#FB7185`, nền kem `#FAF7F0`.
- Font: **Space Grotesk** (tiêu đề) / **Inter** (nội dung) / **JetBrains Mono** (số liệu).
- Micro-interaction: press làm khối "lún" (dịch theo offset shadow). Đóng gói thành widget shared tái dùng.

---

## 10. Checklist trước khi merge màn tiền tệ
- [ ] Không có phép tính balance/quỹ/điểm/stock ở Dart — chỉ render số từ API.
- [ ] Model khớp OpenAPI (đã regenerate sau khi API đổi).
- [ ] Idempotency key cho vote/đổi quà; disable nút khi submitting.
- [ ] IAP/offerwall: chờ backend xác nhận (webhook/postback) mới hiển thị cộng — không tin SDK/store client.
- [ ] Countdown/trạng thái theo mốc server, không dùng giờ máy để quyết nghiệp vụ.
- [ ] Refetch sau mutation (balance, stock, leaderboard, ví quà, notification).
- [ ] Map lỗi nghiệp vụ backend (INSUFFICIENT_BALANCE, CAMPAIGN_CLOSED…) hiển thị thân thiện.
- [ ] Loading/empty/error + safe area cho mọi màn.

---

## 11. Phase
- **0:** scaffold Flutter, auth, generate API client từ OpenAPI.
- **1 Vote:** leaderboard, form vote, đề cử idol + check trùng, thể lệ, referral đăng ký.
- **2 Shop:** daily reward → IAP → special deals + ví quà (offerwall mock), banner point event.
- **3 Profile:** ví+ledger, ví quà, mã mời, đề cử của tôi, hoạt động vote, notification, information, settings.
- **4 Nâng cao:** màn resolution A/B/C, Vote LED, biên lai quỹ.
- **Native:** hoàn thiện app, push notification FCM/APNs.
