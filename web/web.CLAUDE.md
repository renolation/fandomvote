# CLAUDE.md — Web (React)

> Kim chỉ nam cho `fdv/web`. React phục vụ **cả Admin desktop lẫn User web**. Đọc trước khi code.

---

## 0. Luật vàng (không bao giờ vi phạm)

1. **Web là client mỏng.** Mọi business logic (số dư, điểm, tiền, resolution, trần Green…) ở **backend NestJS**. Web chỉ: gọi API → hiển thị → validate cơ bản (UX).
2. **KHÔNG tự tính tiền.** Không cộng/trừ balance ở client, không tự suy ra quỹ/điểm. Luôn lấy con số từ API. Validate client chỉ để báo lỗi sớm — backend mới là người quyết.
3. **KHÔNG tin thời gian client.** Trạng thái campaign OPEN/CLOSED, hạn Green, countdown… dựa trên dữ liệu server trả về (server time UTC+7). Countdown chỉ là hiển thị, hành động vẫn do backend chặn.
4. **Logic không viết 2 lần.** Nếu thấy mình tái hiện luật backend ở client → dừng lại, gọi API. Đổi luật chỉ sửa ở backend.
5. **Type từ OpenAPI.** Model/endpoint sinh từ Swagger backend. Không tự định nghĩa shape lệch contract.

---

## 1. Stack & cấu trúc

- **React** (TypeScript). Share types với backend qua package chung trong monorepo (nếu monorepo).
- Data fetching: ưu tiên một lớp query (React Query/SWR) — cache + revalidate + polling.
- **Realtime phase đầu: POLLING 5–10s** (leaderboard, balance, notification). Nâng cấp WebSocket sau — đóng gói sau hook để swap không đụng UI.
- Hai khu vực rõ ràng: **User web** và **Admin desktop**, dùng chung backend & auth, tách route/layout.

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
- JWT: Access (15–30') + Refresh (xoay vòng). Tự refresh khi 401, retry request.
- Lưu token an toàn; không log token. Guard route theo role **USER/ADMIN** — nhưng nhớ: **client guard chỉ là UX**, backend mới thực thi quyền.
- Đăng ký: ô nhập mã mời (= User ID người giới thiệu), optional. Gmail → popup điền mã trước khi vào app.

---

## 3. Hiển thị tiền tệ (chỉ render, không tính)
- 3 loại: **GREEN / GOLD / DIAMOND**. Lấy balance + lịch sử ledger từ API.
- Green: hiển thị **countdown hết hạn** (dựa `expires_at` từ server). Nhắc nhở "sắp hết hạn" thuần UI.
- Quy đổi hiển thị: 1 Gold = 1đ, 1 Diamond = 1.000 Gold = 1.000đ — chỉ để **show**, không dùng để tự cộng dồn balance.
- Diamond không vote trực tiếp → UI hướng dẫn đổi sang Gold trước (gọi API đổi).

---

## 4. Vote (User web)
- Leaderboard mỗi campaign (poll 5–10s). Nhiều campaign song song, độc lập.
- Form vote: nhập N → gọi API vote (kèm **idempotency key** từ client để chống double-submit). Hiển thị "Green trừ trước → Gold sau" cho minh bạch, **không tự trừ**.
- Nút **📋 Thể lệ**: render `rules_content` của campaign đang xem (HTML/markdown từ API).
- Campaign CLOSED/RESOLVED → disable vote, hiển thị kết quả/biên lai từ API.

## 5. Đề cử idol
- Nhập tên → gọi API check trùng **real-time** (`name_normalized`).
  - Trùng → chặn, gợi ý "vote idol có sẵn".
  - Chưa có → form đề cử → trạng thái PENDING (chờ admin).
- Đưa idol đã duyệt vào campaign: user tự do, không cần duyệt.

## 6. Shop (User web)
- Banner point event (countdown) đầu trang. Daily Reward, Offer Wall, IAP, Special Deals, icon Ví Quà.
- Đổi Special Deal: gọi API atomic; UI hiển thị stock, disable khi hết. **Không tự suy stock** — đọc từ API sau mỗi thao tác.
- Point event x2: chỉ hiển thị banner/multiplier server trả; số bonus do backend tính (ledger tách base+bonus).

## 7. Profile (User web)
Info cá nhân · Ví (Green countdown/Gold/Diamond + ledger) · Ví Quà (digital/physical lọc trạng thái) · Mã mời (=User ID, copy, thống kê) · Đề cử của tôi · Hoạt động vote · Notification in-app (chuông + badge) · Information (contact admin cấu hình) · Cài đặt.
- Notification: poll, badge số chưa đọc, mark-as-read qua API.

---

## 8. Admin (desktop)
Layout sidebar + nội dung, mật độ cao (dashboard/bảng). Tối thiểu (sớm): **duyệt đề cử idol**, **tạo/quản lý campaign** (star_goal, donation_ratio, rule, gán idol), **kết thúc campaign → chạy resolution**. Đầy đủ (Phase 4): shop/deals/stock/partners/IAP, daily reward + point event config, đơn physical, đối soát, cấu hình Information, quản lý user/gian lận/gỡ idol.
- Mọi hành động ghi tiền/đổi trạng thái → gọi API backend; admin web không tự tính.
- `star_goal` không cho sửa sau khi campaign OPEN (disable theo state từ API).

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
- [ ] Gọi đúng endpoint OpenAPI, type khớp contract.
- [ ] Idempotency key cho vote/đổi quà/nạp; disable nút khi đang submit.
- [ ] Countdown/trạng thái dựa server time, không `Date.now()` client để quyết định nghiệp vụ.
- [ ] Refetch sau mutation (balance, stock, leaderboard, notification).
- [ ] Error nghiệp vụ từ backend (INSUFFICIENT_BALANCE, CAMPAIGN_CLOSED…) hiển thị thân thiện.
- [ ] Loading/empty/error state đầy đủ cho mọi list (poll có thể trễ).

---

## 11. Phase
- **0:** scaffold, auth, api client từ OpenAPI.
- **1 Vote:** leaderboard, form vote, đề cử idol + check trùng, thể lệ, referral đăng ký, admin tối thiểu.
- **2 Shop:** daily reward → IAP → special deals + ví quà (offerwall mock), banner point event.
- **3 Profile:** ví+ledger, ví quà, mã mời, đề cử của tôi, hoạt động vote, notification, information, settings.
- **4 Nâng cao:** màn resolution A/B/C, Vote LED, biên lai quỹ, admin đầy đủ + đối soát.
