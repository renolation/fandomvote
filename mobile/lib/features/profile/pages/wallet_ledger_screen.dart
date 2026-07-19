import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/format.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/profile_providers.dart';

const _emoji = {'GREEN': '🟢', 'GOLD': '🟡', 'DIAMOND': '💎'};

class WalletLedgerScreen extends ConsumerWidget {
  const WalletLedgerScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ledger = ref.watch(ledgerProvider);
    final now = DateTime.now();
    return Scaffold(
      appBar: AppBar(title: Text('📜 Lịch sử ví', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: ledger.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(ledgerProvider)),
          data: (page) {
            if (page.items.isEmpty) return const EmptyState('Chưa có giao dịch.');
            return ListView(padding: const EdgeInsets.all(14), children: [
              for (final e in page.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: NeuCard(
                    shadowOffset: 3,
                    Row(children: [
                      Text(_emoji[e.currency] ?? '•', style: const TextStyle(fontSize: 18)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(e.source, style: headFont(size: 13)),
                          Text(formatDate(e.createdAt), style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                          if (e.currency == 'GREEN' && parseDate(e.expiresAt) != null && parseDate(e.expiresAt)!.isAfter(now))
                            Text('⏳ hết hạn sau ${countdownLabel(parseDate(e.expiresAt), now)}',
                                style: monoFont(size: 11, color: Neu.pink)),
                        ]),
                      ),
                      Text('${e.amount >= 0 ? '+' : ''}${formatNumber(e.amount)}',
                          style: monoFont(size: 15, color: e.amount >= 0 ? Neu.green : Neu.pink)),
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
