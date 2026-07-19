import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('FandomVote', style: headFont(size: 28)),
            const SizedBox(height: 16),
            const CircularProgressIndicator(color: Neu.ink),
          ]),
        ),
      );
}
