import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme.dart';
import '../../../shared/widgets.dart';
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
