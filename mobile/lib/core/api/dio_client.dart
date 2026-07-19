import 'package:dio/dio.dart';
import '../env.dart';
import 'api_exception.dart';
import 'token_store.dart';

// Dio + interceptor: gắn JWT, tự refresh khi 401, unwrap { data }, map lỗi nghiệp vụ — §1/§2.
Dio buildDio(TokenStore store, {required void Function() onLogout}) {
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
    contentType: 'application/json',
  ));
  dio.interceptors.add(_AuthInterceptor(dio, store, onLogout));
  return dio;
}

class _AuthInterceptor extends Interceptor {
  final Dio _dio;
  final TokenStore _store;
  final void Function() _onLogout;
  final Dio _bare; // gọi /auth/refresh, KHÔNG dính interceptor (tránh đệ quy)
  Future<String?>? _refreshing;

  _AuthInterceptor(this._dio, this._store, this._onLogout)
      : _bare = Dio(BaseOptions(baseUrl: Env.apiBaseUrl));

  bool _isAuthRoute(String path) =>
      path.contains('/auth/login') ||
      path.contains('/auth/register') ||
      path.contains('/auth/refresh') ||
      path.contains('/auth/google');

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _store.accessToken;
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final idem = options.extra['idempotencyKey'];
    if (idem is String && idem.isNotEmpty) {
      options.headers['Idempotency-Key'] = idem;
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final data = response.data;
    if (data is Map && data.containsKey('data')) {
      response.data = data['data']; // unwrap envelope { data }
    }
    handler.next(response);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final req = err.requestOptions;
    final status = err.response?.statusCode ?? 0;
    final retried = req.extra['retried'] == true;
    final hasToken = _store.accessToken?.isNotEmpty ?? false;

    if (status == 401 && !_isAuthRoute(req.path) && !retried && hasToken) {
      final newToken = await _refresh();
      if (newToken != null) {
        req.extra['retried'] = true;
        req.headers['Authorization'] = 'Bearer $newToken';
        try {
          return handler.resolve(await _dio.fetch(req));
        } catch (_) {
          // rơi xuống map lỗi
        }
      } else {
        await _store.clear();
        _onLogout(); // TOKEN_REUSE/refresh fail → xoá session + về login (§2)
      }
    }
    handler.reject(err.copyWith(error: _mapError(err)));
  }

  Future<String?> _refresh() => _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);

  Future<String?> _doRefresh() async {
    final rt = await _store.readRefresh();
    if (rt == null || rt.isEmpty) return null;
    try {
      final res = await _bare.post('/auth/refresh', data: {'refreshToken': rt});
      final body = res.data;
      final data = (body is Map && body['data'] is Map) ? body['data'] as Map : body as Map;
      final access = data['accessToken'] as String?;
      final refresh = data['refreshToken'] as String?;
      if (access != null && refresh != null) {
        await _store.saveTokens(access, refresh);
        return access;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  ApiException _mapError(DioException err) {
    final status = err.response?.statusCode ?? 0;
    final body = err.response?.data;
    if (body is Map && body['error'] is Map) {
      final e = body['error'] as Map;
      return ApiException((e['code'] ?? 'UNKNOWN').toString(), (e['message'] ?? '').toString(), status);
    }
    if (status == 429) return const ApiException('RATE_LIMITED', 'Quá nhiều yêu cầu', 429);
    return ApiException('NETWORK_ERROR', err.message ?? 'Lỗi kết nối', status);
  }
}

// Wrapper mỏng: trả JSON đã unwrap; ném ApiException khi lỗi.
class ApiClient {
  final Dio _dio;
  const ApiClient(this._dio);

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    final q = query == null ? null : (Map<String, dynamic>.of(query)..removeWhere((_, v) => v == null));
    return _run(() => _dio.get(path, queryParameters: q));
  }

  Future<dynamic> post(String path, {Object? body, String? idempotencyKey}) =>
      _run(() => _dio.post(path, data: body, options: _idem(idempotencyKey)));

  Future<dynamic> patch(String path, {Object? body}) => _run(() => _dio.patch(path, data: body));

  Options? _idem(String? key) => (key == null) ? null : Options(extra: {'idempotencyKey': key});

  Future<dynamic> _run(Future<Response> Function() fn) async {
    try {
      final res = await fn();
      return res.data;
    } on DioException catch (e) {
      final err = e.error;
      if (err is ApiException) throw err;
      throw ApiException('NETWORK_ERROR', e.message ?? 'Lỗi kết nối', e.response?.statusCode ?? 0);
    }
  }
}
