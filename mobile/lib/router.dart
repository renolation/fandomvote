import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'features/auth/pages/login_screen.dart';
import 'features/auth/pages/register_screen.dart';
import 'features/auth/controllers/session_controller.dart';
import 'features/auth/pages/splash_screen.dart';
import 'features/auth/pages/verify_screen.dart';
import 'features/profile/pages/notifications_screen.dart';
import 'features/shell/pages/home_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(sessionProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) {
      final s = ref.read(sessionProvider).status;
      final loc = state.matchedLocation;
      const authPages = {'/login', '/register'};
      if (s == SessionStatus.loading) return loc == '/splash' ? null : '/splash';
      if (loc == '/splash') return s == SessionStatus.authed ? '/' : '/login';
      if (s == SessionStatus.guest) return authPages.contains(loc) ? null : '/login';
      if (s == SessionStatus.authed && authPages.contains(loc)) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/verify', builder: (_, __) => const VerifyScreen()),
      GoRoute(path: '/', builder: (_, __) => const HomeShell()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
    ],
  );
});
