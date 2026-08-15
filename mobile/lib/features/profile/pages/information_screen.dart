import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/env.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';

class InformationScreen extends StatelessWidget {
  const InformationScreen({super.key});

  // Mở link ngoài app. Thất bại (máy không có trình duyệt / app mail) → báo cho user, không im lặng.
  Future<void> _open(BuildContext context, Uri uri) async {
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) showOk(context, 'Không mở được: ${uri.toString()}');
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('ℹ️ Thông tin', style: headFont(size: 18)), backgroundColor: Neu.cream, elevation: 0),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(16), children: [
          NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('FandomVote (FDV)', style: headFont(size: 18)),
            const SizedBox(height: 8),
            const Text('Nền tảng bình chọn idol. Dùng Green (miễn phí) · Gold (cày/nhiệm vụ) · Diamond (nạp) để vote.',
                style: TextStyle(height: 1.5)),
            const SizedBox(height: 12),
            Text('Hỗ trợ', style: headFont(size: 14)),
            const SizedBox(height: 4),
            Text('Email: ${Env.supportEmail}', style: const TextStyle(height: 1.5)),
            const SizedBox(height: 12),
            const Text('Mọi quyết định của FDV là quyết định cuối cùng.',
                style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.5)),
          ])),
          const SizedBox(height: 14),

          // Pháp lý — Google Play/App Store yêu cầu mở được các trang này từ trong app,
          // và phải có lối yêu cầu xoá tài khoản.
          NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Pháp lý', style: headFont(size: 14)),
            const SizedBox(height: 4),
            _LinkRow(
              icon: '🔒',
              label: 'Chính sách quyền riêng tư',
              onTap: () => _open(context, Uri.parse(Env.privacyPolicyUrl)),
            ),
            _LinkRow(
              icon: '📄',
              label: 'Điều khoản sử dụng',
              onTap: () => _open(context, Uri.parse(Env.termsUrl)),
            ),
            _LinkRow(
              icon: '🗑',
              label: 'Yêu cầu xoá tài khoản',
              onTap: () => _open(
                context,
                Uri(
                  scheme: 'mailto',
                  path: Env.supportEmail,
                  queryParameters: const {'subject': 'Yêu cầu xoá tài khoản'},
                ),
              ),
            ),
          ])),
        ]),
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  final String icon;
  final String label;
  final VoidCallback onTap;
  const _LinkRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Row(children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          const Icon(Icons.open_in_new, size: 16, color: Colors.grey),
        ]),
      ),
    );
  }
}
