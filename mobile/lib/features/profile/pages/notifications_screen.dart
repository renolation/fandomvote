import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../common_providers.dart';
import '../controllers/profile_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notis = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('🔔 Thông báo', style: headFont(size: 18)),
        backgroundColor: Neu.cream,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(apiProvider).markAllRead();
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadCountProvider);
            },
            child: const Text('Đọc tất cả'),
          ),
        ],
      ),
      body: SafeArea(
        child: notis.when(
          loading: () => const Loading(),
          error: (e, _) => ErrorState(e, onRetry: () => ref.invalidate(notificationsProvider)),
          data: (page) {
            if (page.items.isEmpty) return const EmptyState('Chưa có thông báo.');
            return ListView(padding: const EdgeInsets.all(14), children: [
              for (final n in page.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GestureDetector(
                    onTap: () async {
                      if (n.unread) {
                        await ref.read(apiProvider).markRead(n.id);
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(unreadCountProvider);
                      }
                    },
                    child: NeuCard(
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(n.title, style: headFont(size: 14)),
                        const SizedBox(height: 4),
                        Text(n.body, style: const TextStyle(fontSize: 13, height: 1.4)),
                      ]),
                      bg: n.unread ? const Color(0xFFFFF9E0) : Neu.white,
                      shadowOffset: 3,
                    ),
                  ),
                ),
            ]);
          },
        ),
      ),
    );
  }
}
