import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../../core/ad_config.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';

// Rewarded video ad (AdMob) — thay Offer Wall.
// LƯU Ý (§0): Gold chỉ được cộng qua backend AdMob SSV (Server-Side Verification), client KHÔNG tự cộng.
// Ad unit ID lấy từ AdConfig (core/ad_config.dart) — đổi test/prod ở đó.
class RewardAdCard extends StatefulWidget {
  const RewardAdCard({super.key});
  @override
  State<RewardAdCard> createState() => _RewardAdCardState();
}

class _RewardAdCardState extends State<RewardAdCard> {
  RewardedAd? _ad;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) _load();
  }

  @override
  void dispose() {
    _ad?.dispose();
    super.dispose();
  }

  void _load() {
    setState(() => _loading = true);
    RewardedAd.load(
      adUnitId: AdConfig.rewarded,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          if (!mounted) {
            ad.dispose();
            return;
          }
          setState(() {
            _ad = ad;
            _loading = false;
          });
        },
        onAdFailedToLoad: (err) {
          if (mounted) {
            setState(() {
              _ad = null;
              _loading = false;
            });
          }
        },
      ),
    );
  }

  void _show() {
    final ad = _ad;
    if (ad == null) return;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _load();
      },
      onAdFailedToShowFullScreenContent: (ad, err) {
        ad.dispose();
        _load();
      },
    );
    ad.show(onUserEarnedReward: (ad, reward) {
      // Xem xong. KHÔNG tự cộng Gold — backend AdMob SSV mới cộng (§0).
      if (mounted) showOk(context, 'Đã xem xong quảng cáo! Gold sẽ cộng sau khi hệ thống xác nhận.');
    });
    setState(() => _ad = null); // đã show → chờ reload
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('🎬 Xem quảng cáo nhận Gold', style: headFont(size: 16)),
        const SizedBox(height: 6),
        Text('Quảng cáo chỉ khả dụng trên app di động (Android/iOS).', style: TextStyle(color: Colors.grey.shade600)),
      ]));
    }
    final ready = _ad != null;
    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('🎬 Xem quảng cáo nhận Gold', style: headFont(size: 16)),
      const SizedBox(height: 6),
      Text('Xem hết 1 video quảng cáo để nhận Gold.', style: TextStyle(color: Colors.grey.shade600)),
      const SizedBox(height: 12),
      NeuButton(
        _loading ? 'Đang tải quảng cáo…' : (ready ? 'Xem quảng cáo' : 'Tải lại quảng cáo'),
        expand: true,
        color: Neu.green,
        textColor: Colors.white,
        loading: _loading,
        onPressed: _loading ? null : (ready ? _show : _load),
      ),
    ]));
  }
}
