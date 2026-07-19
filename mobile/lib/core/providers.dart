import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_service.dart';
import '../features/auth/controllers/session_controller.dart';
import 'api/dio_client.dart';
import 'api/token_store.dart';

// Hạ tầng inject. dioProvider gắn callback forced-logout (interceptor gọi khi refresh fail).
final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final dioProvider = Provider<Dio>((ref) {
  final store = ref.watch(tokenStoreProvider);
  return buildDio(store, onLogout: () => ref.read(sessionProvider.notifier).onForcedLogout());
});

final apiProvider = Provider<ApiService>((ref) => ApiService(ApiClient(ref.watch(dioProvider))));
