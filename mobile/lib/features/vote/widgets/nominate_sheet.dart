import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';

Future<void> openNominateSheet(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: const _NominateSheet(),
    ),
  );
}

class _NominateSheet extends ConsumerStatefulWidget {
  const _NominateSheet();
  @override
  ConsumerState<_NominateSheet> createState() => _NominateSheetState();
}

class _NominateSheetState extends ConsumerState<_NominateSheet> {
  final _name = TextEditingController();
  Timer? _debounce;
  bool _checking = false;
  bool _dup = false;
  String? _dupName;
  bool _busy = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _name.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    final name = v.trim();
    if (name.length < 2) {
      setState(() => _dup = false);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() => _checking = true);
      try {
        final r = await ref.read(apiProvider).checkIdol(name);
        if (mounted) {
          setState(() {
            _dup = r.duplicate;
            _dupName = r.idol?.name;
          });
        }
      } catch (_) {
      } finally {
        if (mounted) setState(() => _checking = false);
      }
    });
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    if (name.length < 2 || _dup || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).nominate(name: name);
      if (mounted) {
        Navigator.pop(context);
        showOk(context, 'Đã gửi đề cử, chờ admin duyệt.');
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final valid = _name.text.trim().length >= 2 && !_dup;
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(18),
      decoration: Neu.box(radius: 16, shadowOffset: 6),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('+ Đề cử Idol mới', style: headFont(size: 18)),
        NeuField('Tên idol', _name, hint: 'Nhập tên idol…', onChanged: _onChanged),
        if (_checking) const Padding(padding: EdgeInsets.only(top: 6), child: Text('Đang kiểm tra trùng…')),
        if (_dup)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text('⚠ Idol đã tồn tại: ${_dupName ?? ''} — hãy vote idol có sẵn.',
                style: headFont(size: 12, color: Neu.pink)),
          ),
        const SizedBox(height: 16),
        NeuButton('Gửi đề cử', expand: true, color: Neu.green, loading: _busy, onPressed: valid ? _submit : null),
      ]),
    );
  }
}
