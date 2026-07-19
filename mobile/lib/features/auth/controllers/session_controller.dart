import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/api_service.dart';
import '../../../api/models/auth.dart';
import '../../../core/api/token_store.dart';
import '../../../core/providers.dart';

enum SessionStatus { loading, authed, guest }

class SessionState {
  final SessionStatus status;
  final AuthUser? user;
  const SessionState(this.status, this.user);
  const SessionState.loading() : this(SessionStatus.loading, null);
  const SessionState.guest() : this(SessionStatus.guest, null);
  SessionState.authed(AuthUser u) : this(SessionStatus.authed, u);
}

final sessionProvider = NotifierProvider<SessionController, SessionState>(SessionController.new);

// Nguồn sự thật về phiên đăng nhập. Bootstrap từ secure storage, refresh /auth/me nền.
class SessionController extends Notifier<SessionState> {
  ApiService get _api => ref.read(apiProvider);
  TokenStore get _store => ref.read(tokenStoreProvider);

  @override
  SessionState build() {
    _restore();
    return const SessionState.loading();
  }

  Future<void> _restore() async {
    await _store.load();
    if (_store.accessToken == null || _store.accessToken!.isEmpty) {
      state = const SessionState.guest();
      return;
    }
    final cached = await _store.readUser();
    if (cached != null) state = SessionState.authed(AuthUser.fromJson(cached));
    try {
      final u = await _api.me();
      await _store.saveUser(u.toJson());
      state = SessionState.authed(u);
    } catch (_) {
      if (state.status != SessionStatus.authed) state = const SessionState.guest();
    }
  }

  Future<void> _persist(AuthResult r) async {
    await _store.saveTokens(r.accessToken, r.refreshToken);
    await _store.saveUser(r.user.toJson());
    state = SessionState.authed(r.user);
  }

  Future<void> login({String? email, String? phone, required String password}) async =>
      _persist(await _api.login(email: email, phone: phone, password: password));

  Future<void> register({
    String? email,
    String? phone,
    required String password,
    required String displayName,
    String? referralCode,
  }) async =>
      _persist(await _api.register(
        email: email,
        phone: phone,
        password: password,
        displayName: displayName,
        referralCode: referralCode,
      ));

  Future<void> google({required String idToken, String? referralCode}) async =>
      _persist(await _api.google(idToken: idToken, referralCode: referralCode));

  Future<void> refreshMe() async {
    try {
      final u = await _api.me();
      await _store.saveUser(u.toJson());
      state = SessionState.authed(u);
    } catch (_) {}
  }

  Future<void> logout() async {
    final rt = await _store.readRefresh();
    if (rt != null && rt.isNotEmpty) {
      try {
        await _api.logout(rt);
      } catch (_) {}
    }
    await _store.clear();
    state = const SessionState.guest();
  }

  // Interceptor đã xoá token (refresh fail / TOKEN_REUSE) → chỉ cần chuyển state.
  void onForcedLogout() => state = const SessionState.guest();
}
