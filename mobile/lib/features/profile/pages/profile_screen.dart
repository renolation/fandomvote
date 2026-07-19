import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/format.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../auth/controllers/session_controller.dart';
import '../../common_providers.dart';
import '../widgets/convert_diamond_sheet.dart';
import '../widgets/gift_confirm_sheet.dart';
import 'information_screen.dart';
import '../controllers/profile_providers.dart';
import 'settings_screen.dart';
import 'vote_activity_screen.dart';
import 'wallet_ledger_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionProvider).user;
    final bal = ref.watch(balanceProvider).valueOrNull;
    if (user == null) return const Loading();

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(referralProvider);
        ref.invalidate(myNominationsProvider);
        ref.invalidate(giftsProvider);
      },
      child: ListView(padding: const EdgeInsets.all(14), children: [
        // User card
        NeuCard(Row(children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Neu.pink,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Neu.ink, width: 3),
              image: (user.avatarUrl != null && user.avatarUrl!.isNotEmpty)
                  ? DecorationImage(image: NetworkImage(user.avatarUrl!), fit: BoxFit.cover)
                  : null,
            ),
            child: (user.avatarUrl == null || user.avatarUrl!.isEmpty)
                ? Text(user.displayName.isNotEmpty ? user.displayName[0].toUpperCase() : '?',
                    style: headFont(size: 22, color: Colors.white))
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(user.displayName, style: headFont(size: 18)),
              Text('@${user.username}', style: monoFont(size: 12, color: Colors.grey.shade600)),
              if (user.fandom != null) Text(user.fandom!, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            ]),
          ),
          if (!user.isVerified)
            NeuButton('Xác thực', color: Neu.yellow, onPressed: () => context.push('/verify')),
        ])),
        const SizedBox(height: 14),

        // Ví
        NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('🎒 Ví của bạn', style: headFont(size: 16)),
          const SizedBox(height: 10),
          _balRow('🟢 Green', bal?.green, Neu.green),
          _balRow('🟡 Gold', bal?.gold, Neu.yellow, warn: (bal?.gold ?? 0) < 0),
          _balRow('💎 Diamond', bal?.diamond, Neu.blue),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: NeuButton('📜 Lịch sử', color: Neu.white, expand: true,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WalletLedgerScreen()))),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: NeuButton('💎→🟡 Đổi', color: Neu.blue, textColor: Colors.white, expand: true,
                  onPressed: () => openConvertDiamondSheet(context, ref)),
            ),
          ]),
        ])),
        const SizedBox(height: 14),

        // Mã mời
        const _ReferralCard(),
        const SizedBox(height: 14),

        // Xếp hạng của tôi (Phase 4)
        NeuCard(Row(children: [
          const Text('🏅', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 10),
          Expanded(child: Text('Xếp hạng của tôi (Top Voter/Earner)', style: headFont(size: 14))),
          const NeuPill('Sắp có', color: Neu.white),
        ]), bg: const Color(0xFFF3F0E8)),
        const SizedBox(height: 14),

        const _MyNominations(),
        const SizedBox(height: 14),
        const _GiftWallet(),
        const SizedBox(height: 14),

        // Hành động
        _actionRow(context, '🔔 Thông báo', () => context.push('/notifications')),
        _actionRow(context, '📝 Hoạt động vote',
            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VoteActivityScreen()))),
        _actionRow(context, '⚙️ Cài đặt',
            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
        _actionRow(context, 'ℹ️ Thông tin',
            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InformationScreen()))),
        const SizedBox(height: 8),
        NeuButton('Đăng xuất', expand: true, color: Neu.pink, textColor: Colors.white,
            onPressed: () => ref.read(sessionProvider.notifier).logout()),
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _balRow(String label, int? v, Color c, {bool warn = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          Container(width: 12, height: 12, decoration: BoxDecoration(color: warn ? Neu.pink : c, shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Expanded(child: Text(label)),
          Text(v == null ? '—' : formatNumber(v), style: monoFont(size: 15, color: warn ? Neu.pink : Neu.ink)),
        ]),
      );

  Widget _actionRow(BuildContext context, String label, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: GestureDetector(
          onTap: onTap,
          child: NeuCard(Row(children: [
            Expanded(child: Text(label, style: headFont(size: 14))),
            const Icon(Icons.chevron_right, color: Neu.ink),
          ]), shadowOffset: 3),
        ),
      );
}

class _ReferralCard extends ConsumerWidget {
  const _ReferralCard();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = ref.watch(referralProvider).valueOrNull;
    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('🎟️ Mã mời của bạn', style: headFont(size: 16)),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: Text(r?.referralCode ?? '—', style: monoFont(size: 14))),
        NeuButton('Copy', color: Neu.white, onPressed: r == null
            ? null
            : () {
                Clipboard.setData(ClipboardData(text: r.referralCode));
                showOk(context, 'Đã copy mã mời');
              }),
      ]),
      if (r != null)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('Đã mời ${r.totalInvited} · Đã thưởng ${r.totalRewarded}',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
        ),
      Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text('Cả hai nhận 500 Gold khi người được mời tích luỹ đủ 500 Gold đầu tiên.',
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ),
    ]));
  }
}

class _MyNominations extends ConsumerWidget {
  const _MyNominations();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final noms = ref.watch(myNominationsProvider).valueOrNull ?? [];
    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('🏆 Đề cử của tôi', style: headFont(size: 16)),
      const SizedBox(height: 8),
      if (noms.isEmpty)
        Text('Bạn chưa đề cử idol nào.', style: TextStyle(color: Colors.grey.shade600))
      else
        for (final n in noms)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              Expanded(child: Text(n.name)),
              NeuPill(n.status, color: n.status == 'APPROVED' ? Neu.green : (n.status == 'REJECTED' ? Neu.pink : Neu.yellow),
                  textColor: n.status == 'PENDING' ? Neu.ink : Colors.white),
            ]),
          ),
    ]));
  }
}

class _GiftWallet extends ConsumerWidget {
  const _GiftWallet();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gifts = ref.watch(giftsProvider).valueOrNull ?? [];
    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('🎁 Ví quà', style: headFont(size: 16)),
      const SizedBox(height: 8),
      if (gifts.isEmpty)
        Text('Ví quà trống.', style: TextStyle(color: Colors.grey.shade600))
      else
        for (final g in gifts)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              Expanded(child: Text('${g.itemType} · ${g.status}${g.code != null ? ' · ${g.code}' : ''}')),
              if (g.itemType == 'DIGITAL' && g.status == 'ACTIVE')
                NeuButton('Dùng', color: Neu.yellow, onPressed: () async {
                  try {
                    await ref.read(apiProvider).useGift(g.id);
                    ref.invalidate(giftsProvider);
                    if (context.mounted) showOk(context, 'Đã dùng quà');
                  } catch (e) {
                    if (context.mounted) showError(context, e);
                  }
                }),
              if (g.itemType == 'PHYSICAL' && g.status == 'PENDING')
                NeuButton('Xác nhận', color: Neu.blue, textColor: Colors.white,
                    onPressed: () => openGiftConfirmSheet(context, ref, g.id)),
            ]),
          ),
    ]));
  }
}
