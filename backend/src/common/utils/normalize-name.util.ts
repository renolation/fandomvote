// Chuẩn hóa tên idol để check trùng — §7. Một hàm chung, không viết lại.
// lowercase + bỏ dấu (NFD strip combining) + trim + collapse spaces.
export function normalizeName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu kết hợp (combining diacritics)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
