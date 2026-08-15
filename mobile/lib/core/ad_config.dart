import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

/// Cấu hình Ad Unit ID (AdMob) — 1 nơi duy nhất.
///
/// CÁCH DÙNG:
///   1. Dev: để `useTestAds = true` → dùng test ID của Google, hiển thị ngay.
///   2. Prod: dán ID thật vào các hằng `_prod...`, rồi đổi `useTestAds = false`.
///
/// Phân loại theo LOẠI quảng cáo (rewarded / interstitial / banner /
/// rewardedInterstitial / appOpen / native) × HỆ ĐIỀU HÀNH (Android / iOS).
///
/// LƯU Ý: App ID (bên dưới) KHÔNG dùng trong code — khai báo ở
/// `android/app/src/main/AndroidManifest.xml` và `ios/Runner/Info.plist`.
///
/// Test ID lấy từ tài liệu chính thức của Google (đã đối chiếu):
/// https://developers.google.com/admob/flutter/rewarded (rewarded)
/// https://developers.google.com/admob/android/test-ads · .../ios/test-ads (các loại còn lại)
class AdConfig {
  AdConfig._();

  /// true = test ID (dev). false = ID thật (prod).
  static const bool useTestAds = true;

  /// Xem xong quảng cáo có gọi backend cộng Gold hay không.
  /// false = chỉ xem ads + thông báo đã xem (test luồng hiển thị).
  /// true  = gọi POST /shop/ads/reward để server cộng Gold.
  ///
  /// SỐ GOLD DO SERVER QUYẾT (platform_config: ads.reward_value_vnd × ads.reward_ratio_bps),
  /// client chỉ hiển thị số server trả về → đổi mức thưởng KHÔNG cần build lại app.
  static const bool creditGoldAfterView = true;

  static bool get _isAndroid => defaultTargetPlatform == TargetPlatform.android;

  // ─────────────────────────── App ID (khai báo native) ───────────────────────────
  // Android test: ca-app-pub-3940256099942544~3347511713   → AndroidManifest.xml
  // iOS test:     ca-app-pub-3940256099942544~1458002511   → Info.plist (GADApplicationIdentifier)
  static const String appIdAndroid = 'ca-app-pub-3940256099942544~3347511713'; // TODO prod
  static const String appIdIos = 'ca-app-pub-3940256099942544~1458002511'; // TODO prod

  // ─────────────────────────── Rewarded (video thưởng) ───────────────────────────
  static const String _testRewardedAndroid = 'ca-app-pub-3940256099942544/5224354917';
  static const String _testRewardedIos = 'ca-app-pub-3940256099942544/1712485313';
  static const String _prodRewardedAndroid = ''; // TODO: dán ID thật
  static const String _prodRewardedIos = ''; // TODO: dán ID thật
  static String get rewarded => _pick(_testRewardedAndroid, _testRewardedIos, _prodRewardedAndroid, _prodRewardedIos);

  // ─────────────────────── Rewarded Interstitial (thưởng xen kẽ) ───────────────────────
  static const String _testRewardedInterAndroid = 'ca-app-pub-3940256099942544/5354046379';
  static const String _testRewardedInterIos = 'ca-app-pub-3940256099942544/6978759866';
  static const String _prodRewardedInterAndroid = ''; // TODO
  static const String _prodRewardedInterIos = ''; // TODO
  static String get rewardedInterstitial =>
      _pick(_testRewardedInterAndroid, _testRewardedInterIos, _prodRewardedInterAndroid, _prodRewardedInterIos);

  // ─────────────────────────── Interstitial (toàn màn hình) ───────────────────────────
  static const String _testInterstitialAndroid = 'ca-app-pub-3940256099942544/1033173712';
  static const String _testInterstitialIos = 'ca-app-pub-3940256099942544/4411468910';
  static const String _prodInterstitialAndroid = ''; // TODO
  static const String _prodInterstitialIos = ''; // TODO
  static String get interstitial =>
      _pick(_testInterstitialAndroid, _testInterstitialIos, _prodInterstitialAndroid, _prodInterstitialIos);

  // ─────────────────────────── Banner ───────────────────────────
  static const String _testBannerAndroid = 'ca-app-pub-3940256099942544/6300978111';
  static const String _testBannerIos = 'ca-app-pub-3940256099942544/2934735716';
  static const String _prodBannerAndroid = ''; // TODO
  static const String _prodBannerIos = ''; // TODO
  static String get banner => _pick(_testBannerAndroid, _testBannerIos, _prodBannerAndroid, _prodBannerIos);

  // ─────────────────────────── App Open (mở app) ───────────────────────────
  static const String _testAppOpenAndroid = 'ca-app-pub-3940256099942544/9257395921';
  static const String _testAppOpenIos = 'ca-app-pub-3940256099942544/5575463023';
  static const String _prodAppOpenAndroid = ''; // TODO
  static const String _prodAppOpenIos = ''; // TODO
  static String get appOpen => _pick(_testAppOpenAndroid, _testAppOpenIos, _prodAppOpenAndroid, _prodAppOpenIos);

  // ─────────────────────────── Native Advanced ───────────────────────────
  static const String _testNativeAndroid = 'ca-app-pub-3940256099942544/2247696110';
  static const String _testNativeIos = 'ca-app-pub-3940256099942544/3986624511';
  static const String _prodNativeAndroid = ''; // TODO
  static const String _prodNativeIos = ''; // TODO
  static String get native => _pick(_testNativeAndroid, _testNativeIos, _prodNativeAndroid, _prodNativeIos);

  /// Chọn ID theo cờ test/prod và OS hiện tại.
  static String _pick(String testAndroid, String testIos, String prodAndroid, String prodIos) {
    if (useTestAds) return _isAndroid ? testAndroid : testIos;
    return _isAndroid ? prodAndroid : prodIos;
  }
}
