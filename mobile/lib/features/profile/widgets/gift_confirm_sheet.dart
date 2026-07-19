import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/profile_providers.dart';

// Xác nhận quà PHYSICAL (PENDING→CONFIRMED) — cần địa chỉ giao hàng (§8).
Future<void> openGiftConfirmSheet(BuildContext context, WidgetRef ref, String giftId) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _GiftConfirmSheet(giftId: giftId),
    ),
  );
}

class _GiftConfirmSheet extends ConsumerStatefulWidget {
  final String giftId;
  const _GiftConfirmSheet({required this.giftId});
  @override
  ConsumerState<_GiftConfirmSheet> createState() => _GiftConfirmSheetState();
}

class _GiftConfirmSheetState extends ConsumerState<_GiftConfirmSheet> {
  String? _selected;
  bool _showForm = false;
  bool _busy = false;
  final _recipient = TextEditingController();
  final _phone = TextEditingController();
  final _line1 = TextEditingController();
  final _ward = TextEditingController();
  final _district = TextEditingController();
  final _province = TextEditingController();

  @override
  void dispose() {
    for (final c in [_recipient, _phone, _line1, _ward, _district, _province]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _createAddress() async {
    if (_recipient.text.trim().isEmpty || _phone.text.trim().isEmpty || _line1.text.trim().isEmpty) {
      showError(context, 'Nhập đủ người nhận, SĐT, địa chỉ');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).createAddress({
        'recipient': _recipient.text.trim(),
        'phone': _phone.text.trim(),
        'line1': _line1.text.trim(),
        'ward': _ward.text.trim(),
        'district': _district.text.trim(),
        'province': _province.text.trim(),
      });
      ref.invalidate(addressesProvider);
      setState(() => _showForm = false);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirm() async {
    if (_selected == null || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).confirmGift(widget.giftId, _selected!);
      ref.invalidate(giftsProvider);
      if (mounted) {
        Navigator.pop(context);
        showOk(context, 'Đã xác nhận, quà sẽ được giao.');
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addrs = ref.watch(addressesProvider).valueOrNull ?? [];
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(18),
      decoration: Neu.box(radius: 16, shadowOffset: 6),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Xác nhận nhận quà', style: headFont(size: 18)),
          const SizedBox(height: 8),
          if (!_showForm) ...[
            for (final a in addrs)
              GestureDetector(
                onTap: () => setState(() => _selected = a.id),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _selected == a.id ? Neu.yellow : Neu.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Neu.ink, width: 2),
                  ),
                  child: Row(children: [
                    Icon(_selected == a.id ? Icons.check_circle : Icons.circle_outlined, size: 18, color: Neu.ink),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(a.recipient, style: headFont(size: 14)),
                        Text('${a.phone} · ${a.line1}', style: const TextStyle(fontSize: 12)),
                      ]),
                    ),
                  ]),
                ),
              ),
            NeuButton('＋ Thêm địa chỉ', color: Neu.white, onPressed: () => setState(() => _showForm = true)),
            const SizedBox(height: 12),
            NeuButton('Xác nhận', expand: true, color: Neu.green, loading: _busy,
                onPressed: _selected == null ? null : _confirm),
          ] else ...[
            NeuField('Người nhận', _recipient),
            NeuField('Số điện thoại', _phone, keyboardType: TextInputType.phone),
            NeuField('Địa chỉ', _line1),
            NeuField('Phường/Xã', _ward),
            NeuField('Quận/Huyện', _district),
            NeuField('Tỉnh/TP', _province),
            const SizedBox(height: 12),
            NeuButton('Lưu địa chỉ', expand: true, color: Neu.blue, textColor: Colors.white, loading: _busy, onPressed: _createAddress),
          ],
        ]),
      ),
    );
  }
}
