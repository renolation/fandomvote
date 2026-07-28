import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/format.dart';
import '../core/theme.dart';
import '../features/common_providers.dart';

const _palette = [Neu.yellow, Neu.blue, Neu.green, Neu.pink];

Color colorForId(String id) {
  var h = 0;
  for (final c in id.codeUnits) {
    h = (h * 31 + c) & 0x7fffffff;
  }
  return _palette[h % _palette.length];
}

// Ô avatar dùng chung (idol + user): có ảnh → ảnh, chưa có → màu theo id.
Widget avatarBox(String id, String? avatarUrl, {double size = 46}) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size >= 64 ? 14 : 10),
        border: Border.all(color: Neu.ink, width: 3),
        color: (avatarUrl == null || avatarUrl.isEmpty) ? colorForId(id) : Neu.white,
        image: (avatarUrl != null && avatarUrl.isNotEmpty)
            ? DecorationImage(image: NetworkImage(avatarUrl), fit: BoxFit.cover)
            : null,
      ),
    );

// 3 chip số dư (poll). Gold < 0 → tô hồng (khoá chi tiêu).
class WalletChips extends ConsumerWidget {
  const WalletChips({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bal = ref.watch(balanceProvider);
    final g = bal.valueOrNull;
    Widget chip(String emoji, int? v, Color c) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(20), border: Border.all(color: Neu.ink, width: 2)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(emoji, style: const TextStyle(fontSize: 12)),
            const SizedBox(width: 4),
            Text(v == null ? '—' : formatNumber(v), style: monoFont(size: 12)),
          ]),
        );
    return Row(mainAxisSize: MainAxisSize.min, children: [
      chip('🟢', g?.green, Neu.green),
      const SizedBox(width: 6),
      chip('🟡', g?.gold, (g != null && g.gold < 0) ? Neu.pink : Neu.yellow),
      const SizedBox(width: 6),
      chip('💎', g?.diamond, Neu.blue),
    ]);
  }
}
