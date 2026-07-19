// Chỉ FORMAT hiển thị — KHÔNG tính toán nghiệp vụ (§0).

String formatNumber(num n) {
  final neg = n < 0;
  final s = n.abs().round().toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return (neg ? '-' : '') + buf.toString();
}

String formatVnd(num n) => '${formatNumber(n)}đ';

DateTime? parseDate(String? iso) => iso == null ? null : DateTime.tryParse(iso)?.toLocal();

String formatDate(String? iso) {
  final d = parseDate(iso);
  if (d == null) return '—';
  return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}

// Đếm ngược tới mốc SERVER (iso). Đơn vị nhỏ nhất = PHÚT (không hiện giây) — theo web/mobile spec.
String countdownLabel(DateTime? target, DateTime now) {
  if (target == null) return '';
  final diff = target.difference(now);
  if (diff.isNegative || diff == Duration.zero) return 'Đã hết hạn';
  final totalMin = diff.inMinutes;
  if (totalMin < 1) return 'Dưới 1 phút';
  final d = totalMin ~/ 1440;
  final h = (totalMin % 1440) ~/ 60;
  final m = totalMin % 60;
  if (d > 0) return '${d}n ${h}g ${m}p';
  if (h > 0) return '${h}g ${m}p';
  return '${m}p';
}
