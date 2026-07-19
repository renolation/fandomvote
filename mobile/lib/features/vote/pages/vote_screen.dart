import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/campaign.dart';
import '../../../core/format.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../../shared/widgets.dart';
import '../widgets/add_idol_sheet.dart';
import '../controllers/campaign_rules.dart';
import 'results_list_screen.dart';
import '../controllers/vote_providers.dart';
import '../widgets/vote_sheet.dart';

class VoteScreen extends ConsumerStatefulWidget {
  const VoteScreen({super.key});
  @override
  ConsumerState<VoteScreen> createState() => _VoteScreenState();
}

class _VoteScreenState extends ConsumerState<VoteScreen> {
  String? _selectedId;

  @override
  Widget build(BuildContext context) {
    final camps = ref.watch(campaignsProvider);
    return camps.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(campaignsProvider)),
      data: (list) {
        if (list.isEmpty) return const EmptyState('Chưa có chiến dịch đang mở.');
        final selected = list.firstWhere((c) => c.id == _selectedId, orElse: () => list.first);
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(campaignsProvider);
            ref.invalidate(leaderboardProvider(selected.id));
          },
          child: ListView(padding: const EdgeInsets.all(14), children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final c in list)
                  GestureDetector(
                    onTap: () => setState(() => _selectedId = c.id),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: c.id == selected.id ? Neu.ink : Neu.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Neu.ink, width: 2),
                      ),
                      child: Text(c.title,
                          style: headFont(size: 13, color: c.id == selected.id ? Colors.white : Neu.ink)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: Text(selected.title, style: headFont(size: 18))),
              NeuButton('📋', color: Neu.blue, textColor: Colors.white, onPressed: () => _showRules(context, selected)),
              const SizedBox(width: 6),
              NeuButton('🏁', color: Neu.white,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResultsListScreen()))),
              const SizedBox(width: 6),
              NeuButton('+ Idol', color: Neu.yellow, onPressed: () => openAddIdolSheet(context, ref, selected.id)),
            ]),
            const SizedBox(height: 14),
            _Board(campaign: selected),
          ]),
        );
      },
    );
  }

  void _showRules(BuildContext context, Campaign c) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        builder: (_, controller) => Container(
          margin: const EdgeInsets.all(10),
          padding: const EdgeInsets.all(18),
          decoration: Neu.box(radius: 16, shadowOffset: 6),
          child: ListView(controller: controller, children: [
            Text('📋 Thể lệ campaign', style: headFont(size: 20)),
            const SizedBox(height: 12),
            for (var i = 0; i < campaignRules.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 26,
                    height: 26,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: Neu.yellow, borderRadius: BorderRadius.circular(8), border: Border.all(color: Neu.ink, width: 2)),
                    child: Text('${i + 1}', style: monoFont(size: 12)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(campaignRules[i], style: const TextStyle(fontSize: 14, height: 1.5))),
                ]),
              ),
            if (c.rulesContent != null && c.rulesContent!.isNotEmpty) ...[
              const Divider(),
              Text('📌 Ghi chú campaign này', style: headFont(size: 13)),
              const SizedBox(height: 6),
              Text(c.rulesContent!, style: const TextStyle(fontSize: 14, height: 1.5)),
            ],
          ]),
        ),
      ),
    );
  }
}

class _Board extends ConsumerWidget {
  final Campaign campaign;
  const _Board({required this.campaign});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final board = ref.watch(leaderboardProvider(campaign.id));
    return board.when(
      loading: () => const Loading(),
      error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(leaderboardProvider(campaign.id))),
      data: (entries) {
        if (entries.isEmpty) return const EmptyState('Chưa có idol trong chiến dịch này.');
        return Column(
          children: [
            for (var i = 0; i < entries.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: NeuCard(Row(children: [
                  SizedBox(width: 26, child: Text('${i + 1}', style: monoFont(size: 15))),
                  idolAvatar(entries[i].idolId, entries[i].avatarUrl, size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(entries[i].name, style: headFont(size: 15)),
                      Text('${formatNumber(entries[i].totalVotes)} ⭐', style: monoFont(size: 13, color: Colors.grey.shade700)),
                    ]),
                  ),
                  if (campaign.isOpen)
                    NeuButton('VOTE', color: Neu.yellow, onPressed: () => openVoteSheet(context, ref, campaign, entries[i])),
                ])),
              ),
          ],
        );
      },
    );
  }
}
