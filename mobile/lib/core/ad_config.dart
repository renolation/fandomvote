import 'package:flutter/foundation.dart' show defaultTargetPlatform, kDebugMode, TargetPlatform;

/// Cấu hình quảng cáo AdMob — 1 nơi duy nhất.
///
/// TEST vs THẬT: tự động theo build.
///   - Debug (flutter run)   → test ID. Tự bấm thoải mái, không ảnh hưởng tài khoản AdMob.
///   - Release (aab/apk)     → ID thật.
/// Không có công tắc tay, nên không thể lỡ ship test ID lên store, cũng không thể tự click
/// quảng cáo thật lúc dev (Google coi đó là invalid traffic → có thể khoá tài khoản).
///
/// BẬT/TẮT từng loại quảng cáo do ADMIN đặt trên web (platform_config `ads.enabled.*`),
/// app đọc qua GET /shop/ads/status → đổi được mà không cần phát hành app mới.
///
/// LƯU Ý: App ID KHÔNG dùng trong code — khai báo ở
/// `android/app/src/main/AndroidManifest.xml` và `ios/Runner/Info.plist`.
///
/// Test ID lấy từ tài liệu chính thức của Google:
/// https://developers.google.com/admob/flutter/rewarded (rewarded)
/// https://developers.google.com/admob/android/test-ads · .../ios/test-ads (các loại còn lại)
class AdConfig {
  AdConfig._();

  /// true = dùng test ID. Bám theo kiểu build, không sửa tay.
  static const bool useTestAds = kDebugMode;

  /// Xem xong quảng cáo có gọi backend cộng Gold hay không.
  /// SỐ GOLD DO SERVER QUYẾT (platform_config: ads.reward_value_vnd × ads.reward_ratio_bps),
  /// client chỉ hiển thị số server trả về → đổi mức thưởng KHÔNG cần build lại app.
  static const bool creditGoldAfterView = true;

  static bool get _isAndroid => defaultTargetPlatform == TargetPlatform.android;

  // ─────────────────────────── App ID (khai báo native) ───────────────────────────
  // Android: đã có ID thật. iOS: chưa đăng ký app trên AdMob → vẫn là App ID test.
  static const String appIdAndroid = 'ca-app-pub-9089828981689816~5258300722';
  static const String appIdIos = 'ca-app-pub-3940256099942544~1458002511'; // TODO: App ID iOS thật

  // ─────────────────────────── Rewarded (video thưởng) ───────────────────────────
  static const String _testRewardedAndroid = 'ca-app-pub-3940256099942544/5224354917';
  static const String _testRewardedIos = 'ca-app-pub-3940256099942544/1712485313';
  static const String _prodRewardedAndroid = 'ca-app-pub-9089828981689816/5109594084';
  static const String _prodRewardedIos = ''; // TODO: tạo ad unit iOS
  static String get rewarded => _pick(_testRewardedAndroid, _testRewardedIos, _prodRewardedAndroid, _prodRewardedIos);

  // ─────────────────────── Rewarded Interstitial (thưởng xen kẽ) ───────────────────────
  static const String _testRewardedInterAndroid = 'ca-app-pub-3940256099942544/5354046379';
  static const String _testRewardedInterIos = 'ca-app-pub-3940256099942544/6978759866';
  static const String _prodRewardedInterAndroid = 'ca-app-pub-9089828981689816/6403278272';
  static const String _prodRewardedInterIos = ''; // TODO: tạo ad unit iOS
  static String get rewardedInterstitial =>
      _pick(_testRewardedInterAndroid, _testRewardedInterIos, _prodRewardedInterAndroid, _prodRewardedInterIos);

  // ─────────────────────────── Interstitial (toàn màn hình) ───────────────────────────
  static const String _testInterstitialAndroid = 'ca-app-pub-3940256099942544/1033173712';
  static const String _testInterstitialIos = 'ca-app-pub-3940256099942544/4411468910';
  static const String _prodInterstitialAndroid = 'ca-app-pub-9089828981689816/8422153132';
  static const String _prodInterstitialIos = ''; // TODO: tạo ad unit iOS
  static String get interstitial =>
      _pick(_testInterstitialAndroid, _testInterstitialIos, _prodInterstitialAndroid, _prodInterstitialIos);

  // ─────────────────────────── Banner ───────────────────────────
  static const String _testBannerAndroid = 'ca-app-pub-3940256099942544/6300978111';
  static const String _testBannerIos = 'ca-app-pub-3940256099942544/2934735716';
  static const String _prodBannerAndroid = 'ca-app-pub-9089828981689816/2323648648';
  static const String _prodBannerIos = ''; // TODO: tạo ad unit iOS
  static String get banner => _pick(_testBannerAndroid, _testBannerIos, _prodBannerAndroid, _prodBannerIos);

  // ─────────────────────────── App Open (mở app) ───────────────────────────
  static const String _testAppOpenAndroid = 'ca-app-pub-3940256099942544/9257395921';
  static const String _testAppOpenIos = 'ca-app-pub-3940256099942544/5575463023';
  static const String _prodAppOpenAndroid = 'ca-app-pub-9089828981689816/1665956912';
  static const String _prodAppOpenIos = ''; // TODO: tạo ad unit iOS
  static String get appOpen => _pick(_testAppOpenAndroid, _testAppOpenIos, _prodAppOpenAndroid, _prodAppOpenIos);

  // ─────────────────────────── Native Advanced ───────────────────────────
  static const String _testNativeAndroid = 'ca-app-pub-3940256099942544/2247696110';
  static const String _testNativeIos = 'ca-app-pub-3940256099942544/3986624511';
  static const String _prodNativeAndroid = ''; // chưa tạo
  static const String _prodNativeIos = '';
  static String get native => _pick(_testNativeAndroid, _testNativeIos, _prodNativeAndroid, _prodNativeIos);

  // ─────────────────── Có ad unit cho nền tảng đang chạy không? ───────────────────
  // BẬT/TẮT do SERVER quyết (admin web → GET /shop/ads/status → formats).
  // Ở đây chỉ kiểm tra đã khai báo ad unit chưa — thiếu (vd iOS chưa tạo) thì không nạp,
  // tránh gọi load với adUnitId rỗng rồi báo lỗi khó hiểu.
  static bool get rewardedHasUnit => rewarded.isNotEmpty;
  static bool get rewardedInterstitialHasUnit => rewardedInterstitial.isNotEmpty;
  static bool get interstitialHasUnit => interstitial.isNotEmpty;
  static bool get bannerHasUnit => banner.isNotEmpty;
  static bool get appOpenHasUnit => appOpen.isNotEmpty;
  static bool get nativeHasUnit => native.isNotEmpty;

  /// Chọn ID theo kiểu build (test/thật) và nền tảng hiện tại.
  static String _pick(String testAndroid, String testIos, String prodAndroid, String prodIos) {
    if (useTestAds) return _isAndroid ? testAndroid : testIos;
    return _isAndroid ? prodAndroid : prodIos;
  }
}
