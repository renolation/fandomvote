import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/session_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _pw = TextEditingController();
  final _ref = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _pw, _ref]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (_email.text.trim().isEmpty && _phone.text.trim().isEmpty) {
      showError(context, 'Cần email hoặc số điện thoại');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(sessionProvider.notifier).register(
            displayName: _name.text.trim(),
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            password: _pw.text,
            referralCode: _ref.text.trim().isEmpty ? null : _ref.text.trim(),
          );
      if (mounted) context.go('/');
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Đăng ký', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: NeuCard(Column(children: [
              NeuField('Tên hiển thị', _name),
              NeuField('Email', _email, keyboardType: TextInputType.emailAddress),
              NeuField('Số điện thoại', _phone, keyboardType: TextInputType.phone),
              NeuField('Mật khẩu (≥ 8 ký tự)', _pw, obscure: true),
              NeuField('Mã mời (tuỳ chọn)', _ref, hint: 'Username người giới thiệu'),
              const SizedBox(height: 8),
              Text(
                'Cả bạn và người mời nhận 500 Gold khi bạn tích luỹ đủ 500 Gold đầu tiên (video/nhiệm vụ/offerwall). Có thể bỏ qua.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 14),
              NeuButton('Tạo tài khoản', expand: true, color: Neu.green, loading: _busy, onPressed: _submit),
            ])),
          ),
        ),
      ),
    );
  }
}
