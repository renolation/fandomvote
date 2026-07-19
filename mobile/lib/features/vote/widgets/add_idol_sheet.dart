import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/campaign.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../../shared/widgets.dart';
import 'nominate_sheet.dart';
import '../controllers/vote_providers.dart';

// Đưa idol ĐÃ DUYỆT vào campaign (§6) — search + Thêm. Có lối đề cử idol mới.
Future<void> openAddIdolSheet(BuildContext context, WidgetRef ref, String campaignId) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _AddIdolSheet(campaignId: campaignId),
    ),
  );
}

class _AddIdolSheet extends ConsumerStatefulWidget {
  final String campaignId;
  const _AddIdolSheet({required this.campaignId});
  @override
  ConsumerState<_AddIdolSheet> createState() => _AddIdolSheetState();
}

class _AddIdolSheetState extends ConsumerState<_AddIdolSheet> {
  final _search = TextEditingController();
  Timer? _debounce;
  List<Idol> _results = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load(String q) async {
    setState(() => _loading = true);
    try {
      final r = await ref.read(apiProvider).idols(search: q.isEmpty ? null : q);
      if (mounted) setState(() => _results = r);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => _load(v.trim()));
  }

  Future<void> _add(Idol idol) async {
    try {
      await ref.read(apiProvider).addIdolToCampaign(widget.campaignId, idol.id);
      ref.invalidate(leaderboardProvider(widget.campaignId));
      if (mounted) {
        Navigator.pop(context);
        showOk(context, 'Đã thêm ${idol.name} vào chiến dịch');
      }
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(18),
      decoration: Neu.box(radius: 16, shadowOffset: 6),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Thêm idol vào chiến dịch', style: headFont(size: 18)),
        NeuField('Tìm idol đã duyệt', _search, hint: 'Nhập tên…', onChanged: _onChanged),
        const SizedBox(height: 10),
        if (_loading)
          const Loading()
        else if (_results.isEmpty)
          const EmptyState('Không tìm thấy idol đã duyệt.')
        else
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              for (final idol in _results)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(children: [
                    idolAvatar(idol.id, idol.avatarUrl, size: 40),
                    const SizedBox(width: 10),
                    Expanded(child: Text(idol.name, style: headFont(size: 14))),
                    NeuButton('Thêm', color: Neu.green, textColor: Colors.white, onPressed: () => _add(idol)),
                  ]),
                ),
            ]),
          ),
        const Divider(),
        NeuButton('＋ Đề cử idol mới', expand: true, color: Neu.yellow, onPressed: () {
          Navigator.pop(context);
          openNominateSheet(context, ref);
        }),
      ]),
    );
  }
}
