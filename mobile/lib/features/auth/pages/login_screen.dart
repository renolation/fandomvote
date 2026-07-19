import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/env.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../controllers/session_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _id = TextEditingController();
  final _pw = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _id.dispose();
    _pw.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final id = _id.text.trim();
      final isEmail = id.contains('@');
      await ref.read(sessionProvider.notifier).login(
            email: isEmail ? id : null,
            phone: isEmail ? null : id,
            password: _pw.text,
          );
      if (mounted) context.go('/');
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _google() async {
    if (Env.googleClientId.isEmpty) return;
    setState(() => _busy = true);
    try {
      final gs = GoogleSignIn(serverClientId: Env.googleClientId);
      final acc = await gs.signIn();
      final idToken = (await acc?.authentication)?.idToken;
      if (idToken == null) return;
      await ref.read(sessionProvider.notifier).google(idToken: idToken);
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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('FandomVote', style: headFont(size: 30)),
                const SizedBox(height: 6),
                Text('Bình chọn idol yêu thích', style: TextStyle(color: Colors.grey.shade600)),
                const SizedBox(height: 20),
                NeuCard(Column(children: [
                  NeuField('Email hoặc SĐT', _id, keyboardType: TextInputType.emailAddress),
                  NeuField('Mật khẩu', _pw, obscure: true),
                  const SizedBox(height: 16),
                  NeuButton('Đăng nhập', expand: true, color: Neu.blue, textColor: Colors.white, loading: _busy, onPressed: _submit),
                  if (Env.googleClientId.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    NeuButton('Đăng nhập Google', expand: true, color: Neu.white, onPressed: _busy ? null : _google),
                  ],
                  const SizedBox(height: 12),
                  TextButton(onPressed: () => context.push('/register'), child: const Text('Chưa có tài khoản? Đăng ký')),
                ])),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
