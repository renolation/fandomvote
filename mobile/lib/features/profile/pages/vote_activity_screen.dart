import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/format.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/profile_providers.dart';

class VoteActivityScreen extends ConsumerWidget {
  const VoteActivityScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final act = ref.watch(voteActivityProvider);
    return Scaffold(
      appBar: AppBar(title: Text('📝 Hoạt động vote', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: act.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(voteActivityProvider)),
          data: (page) {
            if (page.items.isEmpty) return const EmptyState('Chưa có lượt vote nào.');
            return ListView(padding: const EdgeInsets.all(14), children: [
              for (final v in page.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: NeuCard(
                    shadowOffset: 3,
                    Row(children: [
                      Text(v.currency == 'GREEN' ? '🟢' : '🟡', style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Expanded(child: Text('Vote ${formatNumber(v.amount)} ⭐', style: headFont(size: 14))),
                      Text(formatDate(v.createdAt), style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                    ]),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }
}
