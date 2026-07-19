import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Lưu token + user vào secure storage — KHÔNG log token (§2).
class TokenStore {
  static const _kAccess = 'fdv_access';
  static const _kRefresh = 'fdv_refresh';
  static const _kUser = 'fdv_user';

  final FlutterSecureStorage _s = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String? _accessCache;
  String? get accessToken => _accessCache;

  Future<void> load() async {
    _accessCache = await _s.read(key: _kAccess);
  }

  Future<String?> readRefresh() => _s.read(key: _kRefresh);

  Future<Map<String, dynamic>?> readUser() async {
    final raw = await _s.read(key: _kUser);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveTokens(String access, String refresh) async {
    _accessCache = access;
    await _s.write(key: _kAccess, value: access);
    await _s.write(key: _kRefresh, value: refresh);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await _s.write(key: _kUser, value: jsonEncode(user));
  }

  Future<void> clear() async {
    _accessCache = null;
    await _s.delete(key: _kAccess);
    await _s.delete(key: _kRefresh);
    await _s.delete(key: _kUser);
  }
}
