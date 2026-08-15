import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'router.dart';

// AdMob init KHÔNG đặt ở đây: nó là async, gọi kiểu fire-and-forget sẽ khiến request ads
// chạy trước khi SDK sẵn sàng. Việc init do adsInitProvider quản lý và widget ads await nó.
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: FdvApp()));
}

class FdvApp extends ConsumerWidget {
  const FdvApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'FandomVote',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      routerConfig: router,
    );
  }
}
