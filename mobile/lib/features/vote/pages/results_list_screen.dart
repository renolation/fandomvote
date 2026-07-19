import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import 'result_screen.dart';
import '../controllers/vote_providers.dart';

// Danh sách chiến dịch đã kết thúc → xem kết quả (vì tab Vote chỉ hiện campaign OPEN).
class ResultsListScreen extends ConsumerWidget {
  const ResultsListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ended = ref.watch(endedCampaignsProvider);
    return Scaffold(
      appBar: AppBar(title: Text('🏁 Chiến dịch đã kết thúc', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: ended.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(endedCampaignsProvider)),
          data: (list) {
            if (list.isEmpty) return const EmptyState('Chưa có chiến dịch nào kết thúc.');
            return ListView(padding: const EdgeInsets.all(14), children: [
              for (final c in list)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ResultScreen(c.id))),
                    child: NeuCard(Row(children: [
                      Expanded(child: Text(c.title, style: headFont(size: 15))),
                      const NeuPill('Xem', color: Neu.blue, textColor: Colors.white),
                    ])),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }
}
