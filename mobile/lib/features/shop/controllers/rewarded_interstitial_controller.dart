import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../../core/ad_config.dart';
import '../../../core/format.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../auth/controllers/session_controller.dart';
import '../../common_providers.dart';
import 'ad_providers.dart';
import 'shop_providers.dart';

/// Rewarded interstitial: mời xem quảng cáo NGAY SAU KHI VOTE xong.
///
/// Khác rewarded thường ở chỗ user không chủ động bấm, nên chính sách AdMob BẮT BUỘC
/// phải có màn giới thiệu, nói rõ phần thưởng và cho bỏ qua — `_confirm()` bên dưới.
///
/// Điều kiện mời (thiếu 1 cái là bỏ qua, im lặng):
///   1. Có ad unit cho nền tảng đang chạy.
///   2. Admin bật `formats.rewardedInterstitial` trên web.
///   3. Chưa đạt trần lượt/ngày.
///   4. Cách lần mời trước ít nhất `rewardedInterstitialGapSeconds` (admin chỉnh).
///   5. Quảng cáo đã nạp sẵn — chưa sẵn thì nạp nền cho lần vote sau, không bắt user chờ.
///
/// Gold do SERVER cộng qua POST /shop/ads/reward, dùng chung trần/ngày với rewarded (§0).
final rewardedInterstitialProvider = Provider<RewardedInterstitialOffer>(
  (ref) => RewardedInterstitialOffer(ref),
);

class RewardedInterstitialOffer {
  RewardedInterstitialOffer(this._ref);
  final Ref _ref;

  RewardedInterstitialAd? _ad;
  bool _loading = false;
  DateTime? _lastOfferedAt;

  Future<void> maybeOfferAfterVote(BuildContext context) async {
    if (kIsWeb || !AdConfig.rewardedInterstitialHasUnit) return;

    final status = _ref.read(adStatusProvider).valueOrNull;
    if (status == null || !status.formats.rewardedInterstitial) return;

    // Hết lượt hôm nay → không mời (mời xong cũng không cộng được Gold).
    final left = status.remainingToday;
    if (left != null && left <= 0) return;

    final gap = Duration(seconds: status.rewardedInterstitialGapSeconds);
    if (_lastOfferedAt != null && DateTime.now().difference(_lastOfferedAt!) < gap) return;

    if (_ad == null) {
      _preload(); // nạp nền, lần vote sau mới mời
      return;
    }

    _lastOfferedAt = DateTime.now();
    if (!context.mounted) return;
    final accepted = await _confirm(context, status.goldPerView);
    if (accepted != true) return;

    _show();
  }

  void _preload() {
    if (_loading || _ad != null) return;
    _loading = true;
    _ref.read(adsInitProvider.future).then((_) {
      RewardedInterstitialAd.load(
        adUnitId: AdConfig.rewardedInterstitial,
        request: const AdRequest(),
        rewardedInterstitialAdLoadCallback: RewardedInterstitialAdLoadCallback(
          onAdLoaded: (ad) {
            debugPrint('[ads] rewardedInterstitial loaded');
            _loading = false;
            // Gắn userId để bật SSV sau này không phải sửa client.
            final userId = _ref.read(sessionProvider).user?.id;
            if (userId != null) {
              ad.setServerSideOptions(ServerSideVerificationOptions(userId: userId));
            }
            _ad = ad;
          },
          onAdFailedToLoad: (err) {
            debugPrint('[ads] rewardedInterstitial load FAIL code=${err.code} msg=${err.message}');
            _loading = false;
            _ad = null;
          },
        ),
      );
    }).catchError((Object e) {
      debugPrint('[ads] rewardedInterstitial init lỗi: $e');
      _loading = false;
    });
  }

  // Màn giới thiệu bắt buộc theo chính sách AdMob: nêu rõ thưởng + cho bỏ qua.
  Future<bool?> _confirm(BuildContext context, int goldPerView) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: Neu.box(radius: 16, shadowOffset: 6),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('🎁', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 10),
            Text('Nhận thêm ${formatNumber(goldPerView)} Gold?', style: headFont(size: 18), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'Xem hết 1 video quảng cáo để nhận thưởng. Bạn có thể bỏ qua.',
              style: TextStyle(color: Colors.grey.shade600, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            NeuButton('Xem quảng cáo',
                expand: true,
                color: Neu.green,
                textColor: Colors.white,
                onPressed: () => Navigator.pop(ctx, true)),
            const SizedBox(height: 8),
            NeuButton('Bỏ qua', expand: true, color: Neu.white, onPressed: () => Navigator.pop(ctx, false)),
          ]),
        ),
      ),
    );
  }

  void _show() {
    final ad = _ad;
    if (ad == null) return;
    _ad = null; // đã dùng
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _preload(); // sẵn sàng cho lần sau
      },
      onAdFailedToShowFullScreenContent: (ad, err) {
        debugPrint('[ads] rewardedInterstitial show FAIL code=${err.code} msg=${err.message}');
        ad.dispose();
        _preload();
      },
    );
    ad.show(onUserEarnedReward: (ad, reward) => _claim());
  }

  // Server tính và cộng Gold; client chỉ làm mới số dư.
  Future<void> _claim() async {
    try {
      final r = await _ref.read(apiProvider).claimAdReward();
      _ref.invalidate(balanceProvider);
      _ref.invalidate(adStatusProvider);
      debugPrint('[ads] rewardedInterstitial +${r.goldAwarded} Gold');
    } catch (e) {
      debugPrint('[ads] rewardedInterstitial cộng Gold lỗi: $e');
    }
  }
}
