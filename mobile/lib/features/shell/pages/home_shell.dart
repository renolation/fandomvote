import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets.dart';
import '../../auth/controllers/session_controller.dart';
import '../../common_providers.dart';
import '../../profile/pages/profile_screen.dart';
import '../../shop/pages/shop_screen.dart';
import '../../vote/pages/vote_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;
  static const _pages = [VoteScreen(), ShopScreen(), ProfileScreen()];

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;
    final user = ref.watch(sessionProvider).user;
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(children: [
          Container(
            padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Neu.ink, width: 3))),
            child: Row(children: [
              const WalletChips(),
              const Spacer(),
              Stack(clipBehavior: Clip.none, children: [
                IconButton(onPressed: () => context.push('/notifications'), icon: const Icon(Icons.notifications_none, color: Neu.ink)),
                if (unread > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Neu.pink, shape: BoxShape.circle),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text('$unread', textAlign: TextAlign.center, style: monoFont(size: 9, color: Colors.white)),
                    ),
                  ),
              ]),
              // Avatar user ở header (như web) — bấm vào mở tab Hồ sơ.
              if (user != null)
                GestureDetector(
                  onTap: () => setState(() => _index = 2),
                  child: Padding(
                    padding: const EdgeInsets.only(left: 2, right: 6),
                    child: avatarBox(user.id, user.avatarUrl, size: 36),
                  ),
                ),
            ]),
          ),
          Expanded(child: IndexedStack(index: _index, children: _pages)),
        ]),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Neu.white,
        destinations: const [
          NavigationDestination(icon: Text('🗳️', style: TextStyle(fontSize: 20)), label: 'Vote'),
          NavigationDestination(icon: Text('🛒', style: TextStyle(fontSize: 20)), label: 'Shop'),
          NavigationDestination(icon: Text('👤', style: TextStyle(fontSize: 20)), label: 'Hồ sơ'),
        ],
      ),
    );
  }
}
