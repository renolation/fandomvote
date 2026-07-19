import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/campaign.dart';
import '../../../core/format.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../common_providers.dart';
import '../controllers/vote_providers.dart';

// Bottom sheet nhập số sao vote. Response từ backend (Green trừ trước → Gold) — client KHÔNG tự trừ.
Future<void> openVoteSheet(BuildContext context, WidgetRef ref, Campaign campaign, LeaderboardEntry entry) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _VoteSheet(campaign: campaign, entry: entry),
    ),
  );
}

class _VoteSheet extends ConsumerStatefulWidget {
  final Campaign campaign;
  final LeaderboardEntry entry;
  const _VoteSheet({required this.campaign, required this.entry});
  @override
  ConsumerState<_VoteSheet> createState() => _VoteSheetState();
}

class _VoteSheetState extends ConsumerState<_VoteSheet> {
  final _amount = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final n = int.tryParse(_amount.text.trim()) ?? 0;
    if (n <= 0 || _busy) return;
    setState(() => _busy = true);
    final api = ref.read(apiProvider);
    try {
      final res = await api.vote(
        campaignIdolId: widget.entry.campaignIdolId,
        amount: n,
        idempotencyKey: api.newIdempotencyKey(),
      );
      // Refetch balance + leaderboard (§10).
      ref.invalidate(balanceProvider);
      ref.invalidate(leaderboardProvider(widget.campaign.id));
      if (mounted) {
        Navigator.pop(context);
        showOk(context, 'Đã vote ${formatNumber(n)} ⭐ · Green −${res.greenSpent}, Gold −${res.goldSpent}');
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(18),
      decoration: Neu.box(radius: 16, shadowOffset: 6),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Vote cho ${widget.entry.name}', style: headFont(size: 18)),
        const SizedBox(height: 4),
        Text('Nhập số sao muốn vote', style: TextStyle(color: Colors.grey.shade600)),
        NeuField('Số sao', _amount, keyboardType: TextInputType.number),
        const SizedBox(height: 10),
        Wrap(spacing: 8, children: [
          for (final q in [10, 50, 100, 500])
            NeuButton('$q', color: Neu.white, onPressed: () => _amount.text = '$q'),
        ]),
        const SizedBox(height: 16),
        NeuButton('⭐ Xác nhận vote', expand: true, color: Neu.blue, textColor: Colors.white, loading: _busy, onPressed: _submit),
      ]),
    );
  }
}
