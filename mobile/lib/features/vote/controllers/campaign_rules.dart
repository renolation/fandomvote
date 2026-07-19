// Thể lệ campaign — bộ quy tắc GLOBAL, đồng bộ với web/backend.
const campaignRules = <String>[
  'Tiền tệ: 🟢 Green (miễn phí, có hạn dùng) · 🟡 Gold · 💎 Diamond (1 Diamond = 1.000 Gold).',
  'Mỗi sao vote trừ Green trước, hết Green mới trừ Gold. Diamond phải đổi sang Gold mới vote được.',
  'Mỗi campaign có Star Goal cho từng idol và thời hạn đếm ngược hiển thị ở banner.',
  'CHIẾN THẮNG BÌNH CHỌN: idol vừa đạt Star Goal vừa có lượt vote cao nhất khi campaign kết thúc sẽ kích hoạt thưởng LED — mở bình chọn thiết kế LED 3 ngày cho fan đã vote idol thắng.',
  'KHÔNG IDOL NÀO CHIẾN THẮNG: nếu không idol nào đạt mốc, Gold đã vote được quy đổi ×0,5 và quyên góp cho Quỹ Trái Tim Việt Nam (Green KHÔNG vào quỹ).',
  'Green dùng để vote nhưng không quy đổi thành tiền/quỹ; hãy dùng trước khi hết hạn.',
  'Bảng xếp hạng tích luỹ (Idol / Top Voter / Top Earner) chốt theo Ngày/Tuần/Tháng; người thắng được admin duyệt chống gian lận rồi trao thưởng qua email.',
  'Hành vi gian lận (bot, nhiều tài khoản, lạm dụng ưu đãi) sẽ bị huỷ kết quả và khoá tài khoản.',
  'Trong cùng thời gian có thể có nhiều campaign chạy song song và độc lập về tính vote (điểm vote không dùng chung giữa các campaign).',
  'Mọi quyết định của FandomVote (FDV) là quyết định cuối cùng.',
];
