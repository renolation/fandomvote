import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';

class InformationScreen extends StatelessWidget {
  const InformationScreen({super.key});
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
            const Text('Email: support@fdv.vn', style: TextStyle(height: 1.5)),
            const SizedBox(height: 12),
            const Text('Mọi quyết định của FDV là quyết định cuối cùng.',
                style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.5)),
          ])),
        ]),
      ),
    );
  }
}
