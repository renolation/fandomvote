import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/models/wallet.dart';
import '../core/env.dart';
import '../core/providers.dart';

// Poll balance/notification 5–10s (§1). Giữ giá trị cũ khi 1 lần poll lỗi.
final balanceProvider = StreamProvider.autoDispose<Balance>((ref) async* {
  final api = ref.watch(apiProvider);
  Balance? last;
  while (true) {
    try {
      last = await api.balance();
      yield last;
    } catch (e) {
      if (last == null) rethrow;
    }
    await Future.delayed(Env.pollInterval);
  }
});

final unreadCountProvider = StreamProvider.autoDispose<int>((ref) async* {
  final api = ref.watch(apiProvider);
  var last = 0;
  while (true) {
    try {
      last = await api.unreadCount();
    } catch (_) {}
    yield last;
    await Future.delayed(Env.pollInterval);
  }
});

final activeEventsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).activeEvents());
