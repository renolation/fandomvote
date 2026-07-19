import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/session_controller.dart';

// Xác thực tài khoản (email/SĐT). KHÔNG gate referral (referral theo mốc 500 Gold — §2).
class VerifyScreen extends ConsumerStatefulWidget {
  const VerifyScreen({super.key});
  @override
  ConsumerState<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends ConsumerState<VerifyScreen> {
  String _channel = 'EMAIL';
  final _otp = TextEditingController();
  bool _sent = false;
  bool _busy = false;

  @override
  void dispose() {
    _otp.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).verifyRequest(_channel);
      setState(() => _sent = true);
      if (mounted) showOk(context, 'Đã gửi OTP');
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).verifyConfirm(_channel, _otp.text.trim());
      await ref.read(sessionProvider.notifier).refreshMe();
      if (mounted) {
        showOk(context, 'Xác thực thành công');
        Navigator.of(context).maybePop();
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Xác thực tài khoản', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'EMAIL', label: Text('Email')),
                ButtonSegment(value: 'PHONE', label: Text('SĐT')),
              ],
              selected: {_channel},
              onSelectionChanged: (s) => setState(() => _channel = s.first),
            ),
            const SizedBox(height: 8),
            if (!_sent)
              NeuButton('Gửi mã OTP', expand: true, loading: _busy, onPressed: _request)
            else ...[
              NeuField('Nhập OTP (6 số)', _otp, keyboardType: TextInputType.number),
              const SizedBox(height: 12),
              NeuButton('Xác nhận', expand: true, color: Neu.green, loading: _busy, onPressed: _confirm),
              TextButton(onPressed: _busy ? null : _request, child: const Text('Gửi lại OTP')),
            ],
          ])),
        ),
      ),
    );
  }
}
