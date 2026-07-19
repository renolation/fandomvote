import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/campaign.dart';
import '../../../core/format.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../../shared/widgets.dart';
import '../controllers/vote_providers.dart';

// Kết quả A/B/C — §5. A: đạt mốc → Vote LED (receipt null). B: trượt → biên lai quỹ per-user. C: an ủi.
class ResultScreen extends ConsumerWidget {
  final String campaignId;
  const ResultScreen(this.campaignId, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final res = ref.watch(campaignResultProvider(campaignId));
    return Scaffold(
      appBar: AppBar(title: Text('🏁 Kết quả', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: res.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(campaignResultProvider(campaignId))),
          data: (r) => _body(context, r),
        ),
      ),
    );
  }

  Widget _body(BuildContext context, CampaignResult r) {
    final reachedTop = r.snapshot.isNotEmpty && r.snapshot.any((e) => e.reachedValueAt != null);
    late final String badge, note;
    late final Color color;
    if (r.receipt != null) {
      badge = 'KẾT QUẢ B — GÂY QUỸ';
      note = 'Không idol nào đạt mốc. Gold đã vote quy đổi ×0,5 quyên góp Quỹ Trái Tim Việt Nam.';
      color = Neu.pink;
    } else if (reachedTop) {
      badge = 'KẾT QUẢ A — VOTE LED';
      note = 'Có idol đạt Star Goal → kích hoạt thưởng Vote LED cho fan.';
      color = Neu.green;
    } else {
      badge = 'KẾT QUẢ C — AN ỦI';
      note = 'Không idol nào đạt mốc, không gây quỹ. Cảm ơn fan đã đồng hành.';
      color = Neu.yellow;
    }

    return ListView(padding: const EdgeInsets.all(14), children: [
      Text(r.campaign.title, style: headFont(size: 22)),
      const SizedBox(height: 10),
      NeuCard(bg: color, Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(badge, style: headFont(size: 15)),
        const SizedBox(height: 6),
        Text(note, style: const TextStyle(fontSize: 13, height: 1.4)),
      ])),
      if (r.receipt != null) ...[
        const SizedBox(height: 12),
        NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('🧾 Biên lai của bạn', style: headFont(size: 15)),
          const SizedBox(height: 6),
          Text('Gold đã vote: ${formatNumber(r.receipt!.goldVoted)}'),
          Text('Đã quyên góp: ${formatVnd(r.receipt!.donatedVnd)}'),
        ])),
      ],
      const SizedBox(height: 16),
      Text('🏅 Xếp hạng cuối', style: headFont(size: 16)),
      const SizedBox(height: 8),
      for (var i = 0; i < r.snapshot.length; i++)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: NeuCard(shadowOffset: 3, Row(children: [
            SizedBox(width: 24, child: Text('${i + 1}', style: monoFont(size: 15))),
            idolAvatar(r.snapshot[i].idolId, r.snapshot[i].avatarUrl, size: 40),
            const SizedBox(width: 10),
            Expanded(child: Text(r.snapshot[i].name, style: headFont(size: 14))),
            Text('${formatNumber(r.snapshot[i].totalVotes)} ⭐', style: monoFont(size: 13)),
          ])),
        ),
    ]);
  }
}
