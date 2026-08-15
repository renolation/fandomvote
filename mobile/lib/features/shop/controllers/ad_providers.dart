import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

// Khởi tạo AdMob SDK — CHẠY XONG rồi mới được request ads.
// Không await initialize() sẽ khiến RewardedAd.load() chạy trước khi SDK sẵn sàng và fail.
// FutureProvider (không autoDispose) → chỉ init 1 lần cho cả app, các widget cùng chờ 1 future.
final adsInitProvider = FutureProvider<void>((ref) async {
  if (kIsWeb) return; // web không có AdMob
  await MobileAds.instance.initialize();
});
