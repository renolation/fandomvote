import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../auth/controllers/session_controller.dart';

// Cài đặt hồ sơ: sửa tên hiển thị / fandom / avatar (URL). §8.
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});
  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late final TextEditingController _name;
  late final TextEditingController _fandom;
  late final TextEditingController _avatar;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(sessionProvider).user;
    _name = TextEditingController(text: u?.displayName ?? '');
    _fandom = TextEditingController(text: u?.fandom ?? '');
    _avatar = TextEditingController(text: u?.avatarUrl ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _fandom.dispose();
    _avatar.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _busy = true);
    try {
      await ref.read(apiProvider).updateProfile({
        'displayName': _name.text.trim(),
        'fandom': _fandom.text.trim(),
        'avatarUrl': _avatar.text.trim(),
      });
      await ref.read(sessionProvider.notifier).refreshMe();
      if (mounted) {
        showOk(context, 'Đã lưu hồ sơ');
        Navigator.pop(context);
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
      appBar: AppBar(title: Text('⚙️ Cài đặt', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: NeuCard(Column(children: [
            NeuField('Tên hiển thị', _name),
            NeuField('Fandom', _fandom),
            NeuField('Avatar (URL ảnh)', _avatar),
            const SizedBox(height: 16),
            NeuButton('Lưu thay đổi', expand: true, color: Neu.green, loading: _busy, onPressed: _save),
          ])),
        ),
      ),
    );
  }
}
