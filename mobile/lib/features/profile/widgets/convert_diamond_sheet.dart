import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../common_providers.dart';

// Đổi Diamond → Gold (một chiều, không hoàn — §4). Backend quyết định; client chỉ gửi số Diamond.
Future<void> openConvertDiamondSheet(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: const _ConvertSheet(),
    ),
  );
}

class _ConvertSheet extends ConsumerStatefulWidget {
  const _ConvertSheet();
  @override
  ConsumerState<_ConvertSheet> createState() => _ConvertSheetState();
}

class _ConvertSheetState extends ConsumerState<_ConvertSheet> {
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
    try {
      await ref.read(apiProvider).convertDiamond(n);
      ref.invalidate(balanceProvider);
      if (mounted) {
        Navigator.pop(context);
        showOk(context, 'Đã đổi $n 💎 → ${n * 1000} 🟡');
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
        Text('💎 → 🟡 Đổi Diamond sang Gold', style: headFont(size: 18)),
        const SizedBox(height: 4),
        Text('1 Diamond = 1.000 Gold · một chiều, không hoàn.', style: TextStyle(color: Colors.grey.shade600)),
        NeuField('Số Diamond muốn đổi', _amount, keyboardType: TextInputType.number),
        const SizedBox(height: 16),
        NeuButton('Xác nhận đổi', expand: true, color: Neu.blue, textColor: Colors.white, loading: _busy, onPressed: _submit),
      ]),
    );
  }
}
