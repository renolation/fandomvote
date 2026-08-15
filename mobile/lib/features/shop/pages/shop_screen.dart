import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/shop.dart';
import '../../../core/format.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../../shared/widgets.dart';
import '../../common_providers.dart';
import '../controllers/shop_providers.dart';
import '../widgets/reward_ad_card.dart';

class ShopScreen extends ConsumerWidget {
  const ShopScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(activeEventsProvider);
        ref.invalidate(dailyRewardProvider);
        ref.invalidate(dailyStatusProvider);
        ref.invalidate(iapProvider);
        ref.invalidate(dealsProvider);
        ref.invalidate(adStatusProvider);
      },
      child: ListView(padding: const EdgeInsets.all(14), children: const [
        _EventBanner(),
        _DailyCard(),
        SizedBox(height: 18),
        RewardAdCard(),
        SizedBox(height: 18),
        _IapGrid(),
        SizedBox(height: 18),
        _DealsList(),
      ]),
    );
  }
}

class _EventBanner extends ConsumerWidget {
  const _EventBanner();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ev = ref.watch(activeEventsProvider).valueOrNull;
    if (ev == null || ev.isEmpty) return const SizedBox.shrink();
    final e = ev.first;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: Neu.box(bg: Neu.yellow, radius: 16, shadowOffset: 5),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${e.title} ×${e.multiplier.toStringAsFixed(1)}', style: headFont(size: 22)),
            if (e.bannerText != null) Text(e.bannerText!, style: const TextStyle(fontWeight: FontWeight.w600)),
          ]),
        ),
        Column(children: [
          Text('KẾT THÚC SAU', style: monoFont(size: 10)),
          Text(countdownLabel(parseDate(e.endsAt), DateTime.now()), style: monoFont(size: 16, color: Neu.pink)),
        ]),
      ]),
    );
  }
}

class _DailyCard extends ConsumerWidget {
  const _DailyCard();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tiers = ref.watch(dailyRewardProvider).valueOrNull ?? [];
    final status = ref.watch(dailyStatusProvider).valueOrNull;
    final claimed = status?.claimedToday ?? false;
    final currentDay = status?.dayIndex ?? 1; // ngày chuỗi hôm nay (streak)

    Future<void> claim() async {
      try {
        await ref.read(apiProvider).claimDaily();
        ref.invalidate(balanceProvider);
        ref.invalidate(dailyStatusProvider);
        if (context.mounted) showOk(context, 'Điểm danh thành công!');
      } catch (e) {
        if (context.mounted) showError(context, e);
      }
    }

    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('📅 Điểm danh hằng ngày', style: headFont(size: 16)),
      const SizedBox(height: 12),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final t in tiers)
          // Ngày đã qua trong chuỗi: xanh ✓ · ngày hiện tại chưa nhận: vàng · ngày tương lai: trắng.
          _DayTile(
            tier: t,
            done: t.dayIndex < currentDay || (t.dayIndex == currentDay && claimed),
            active: t.dayIndex == currentDay && !claimed,
          ),
      ]),
      const SizedBox(height: 12),
      NeuButton(claimed ? '✓ Đã điểm danh' : 'Điểm danh nhận Green',
          expand: true, color: claimed ? Neu.white : Neu.green, onPressed: claimed ? null : claim),
    ]));
  }
}

// 1 ô ngày trong dải điểm danh.
class _DayTile extends StatelessWidget {
  const _DayTile({required this.tier, required this.done, required this.active});
  final DailyRewardTier tier;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final bg = done ? Neu.green : (active ? Neu.yellow : Neu.white);
    final fg = done ? Colors.white : Neu.ink;
    return Container(
      width: 64,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Neu.ink, width: 2),
      ),
      child: Column(children: [
        Text('Ngày ${tier.dayIndex}', style: monoFont(size: 10, color: fg)),
        Text(done ? '✓' : '+${tier.greenAmount}', style: monoFont(size: 13, color: fg)),
      ]),
    );
  }
}

class _IapGrid extends ConsumerWidget {
  const _IapGrid();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final iap = ref.watch(iapProvider).valueOrNull ?? [];
    if (iap.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('💎 Nạp Diamond', style: headFont(size: 16)),
      const SizedBox(height: 10),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        // 1.6 làm ô thấp hơn nội dung ~1px → RenderFlex overflow. 1.45 để dư chỗ,
        // chịu được cả khi user phóng to cỡ chữ hệ thống.
        childAspectRatio: 1.45,
        children: [
          for (final p in iap)
            NeuCard(Column(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${formatNumber(p.total)}💎', style: monoFont(size: 20)),
              NeuButton(formatVnd(p.priceVnd), expand: true, color: Neu.blue, textColor: Colors.white,
                  onPressed: () => showOk(context, 'Nạp qua App Store / Google Play (Diamond cộng sau xác nhận).')),
            ])),
        ],
      ),
    ]);
  }
}

class _DealsList extends ConsumerWidget {
  const _DealsList();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deals = ref.watch(dealsProvider).valueOrNull ?? [];
    if (deals.isEmpty) return const SizedBox.shrink();

    Future<void> redeem(String id) async {
      try {
        await ref.read(apiProvider).redeemDeal(id);
        ref.invalidate(balanceProvider);
        ref.invalidate(dealsProvider);
        if (context.mounted) showOk(context, 'Đổi quà thành công!');
      } catch (e) {
        if (context.mounted) showError(context, e);
      }
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('🎁 Ưu đãi đối tác', style: headFont(size: 16)),
      const SizedBox(height: 10),
      for (final d in deals)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: NeuCard(Row(children: [
            // Ảnh quà; chưa có ảnh → ô màu theo id (dùng chung avatarBox).
            avatarBox(d.id, d.imageUrl, size: 48),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.title, style: headFont(size: 15)),
                Text('${formatNumber(d.cost)} ${d.currency == 'GOLD' ? '🟡' : '💎'} · còn ${d.remaining}',
                    style: monoFont(size: 12, color: Colors.grey.shade700)),
              ]),
            ),
            NeuButton('Đổi', color: Neu.yellow, onPressed: d.soldOut ? null : () => redeem(d.id)),
          ])),
        ),
    ]);
  }
}
