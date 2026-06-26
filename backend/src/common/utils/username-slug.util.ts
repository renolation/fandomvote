// Chuẩn hóa chuỗi thành slug username/mã mời: lowercase, bỏ dấu, chỉ giữ [a-z0-9].
// Khác normalizeName (giữ khoảng trắng để match tên idol) — username không có space.
export function slugifyUsername(raw: string): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu kết hợp
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // bỏ mọi ký tự ngoài a-z0-9 (gồm cả space)
}
