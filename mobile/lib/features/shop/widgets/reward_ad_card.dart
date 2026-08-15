import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../../core/ad_config.dart';
import '../../../core/format.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/neu.dart';
import '../../../shared/state_views.dart';
import '../../auth/controllers/session_controller.dart';
import '../../common_providers.dart';
import '../controllers/ad_providers.dart';
import '../controllers/shop_providers.dart';

// Rewarded video (AdMob). Ad unit ID lấy từ AdConfig (core/ad_config.dart).
//
// Luồng: chờ SDK init xong → load → show → onUserEarnedReward.
// AdConfig.creditGoldAfterView = false → chỉ thông báo đã xem (đang test hiển thị).
// = true  → gọi POST /shop/ads/reward, SERVER tính số Gold; client không tự cộng tiền (§0).
class RewardAdCard extends ConsumerStatefulWidget {
  const RewardAdCard({super.key});
  @override
  ConsumerState<RewardAdCard> createState() => _RewardAdCardState();
}

class _RewardAdCardState extends ConsumerState<RewardAdCard> {
  RewardedAd? _ad;
  bool _loading = false;
  bool _claiming = false;
  String? _error; // lỗi load/show gần nhất — hiện thẳng lên UI để chẩn đoán được ngay
  int _watched = 0; // số lượt đã xem trong phiên (dùng khi chưa bật cộng Gold)

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

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    // BẮT BUỘC: chờ MobileAds.instance.initialize() xong mới request, nếu không request sẽ fail.
    try {
      await ref.read(adsInitProvider.future);
    } catch (e) {
      debugPrint('[ads] init thất bại: $e');
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Khởi tạo AdMob thất bại: $e';
        });
      }
      return;
    }
    if (!mounted) return;

    RewardedAd.load(
      adUnitId: AdConfig.rewarded,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          debugPrint('[ads] loaded unit=${AdConfig.rewarded}');
          if (!mounted) {
            ad.dispose();
            return;
          }
          // SSV: gắn userId để khi bật Server-Side Verification, AdMob gọi callback kèm user_id
          // → backend cộng Gold dựa trên chữ ký của Google. Phải set trước show().
          if (AdConfig.creditGoldAfterView) {
            final userId = ref.read(sessionProvider).user?.id;
            if (userId != null) {
              ad.setServerSideOptions(ServerSideVerificationOptions(userId: userId));
            }
          }
          setState(() {
            _ad = ad;
            _loading = false;
          });
        },
        onAdFailedToLoad: (err) {
          debugPrint('[ads] load FAIL code=${err.code} domain=${err.domain} msg=${err.message}');
          if (mounted) {
            setState(() {
              _ad = null;
              _loading = false;
              _error = 'Không tải được quảng cáo (code ${err.code}): ${err.message}';
            });
          }
        },
      ),
    );
  }

  // Đã xem hết video. Chưa bật cộng Gold → chỉ ghi nhận + thông báo.
  Future<void> _onEarned(RewardItem reward) async {
    debugPrint('[ads] earned amount=${reward.amount} type=${reward.type}');
    setState(() => _watched++);

    if (!AdConfig.creditGoldAfterView) {
      if (mounted) showOk(context, '✅ Đã xem xong quảng cáo (lượt thứ $_watched)');
      return;
    }

    setState(() => _claiming = true);
    try {
      final r = await ref.read(apiProvider).claimAdReward();
      ref.invalidate(balanceProvider);
      ref.invalidate(adStatusProvider);
      if (mounted) {
        showOk(context, '+${formatNumber(r.goldAwarded)} Gold · còn ${r.remainingToday} lượt hôm nay');
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

  void _show() {
    final ad = _ad;
    if (ad == null) return;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        if (mounted) _load(); // nạp sẵn lượt tiếp theo
      },
      onAdFailedToShowFullScreenContent: (ad, err) {
        debugPrint('[ads] show FAIL code=${err.code} domain=${err.domain} msg=${err.message}');
        ad.dispose();
        if (mounted) {
          setState(() => _error = 'Không hiển thị được quảng cáo (code ${err.code}): ${err.message}');
          _load();
        }
      },
    );
    ad.show(onUserEarnedReward: (ad, reward) => _onEarned(reward));
    setState(() => _ad = null); // đã show → chờ nạp quảng cáo mới
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('🎬 Xem quảng cáo', style: headFont(size: 16)),
        const SizedBox(height: 6),
        Text('Quảng cáo chỉ khả dụng trên app di động (Android/iOS).',
            style: TextStyle(color: Colors.grey.shade600)),
      ]));
    }

    // Chỉ gọi API hạn mức khi thực sự cộng Gold (cờ là const → dependency không đổi lúc chạy).
    final status = AdConfig.creditGoldAfterView ? ref.watch(adStatusProvider).valueOrNull : null;
    final capReached = status != null && status.remainingToday <= 0;
    final ready = _ad != null;
    final busy = _loading || _claiming;

    final String label;
    if (_claiming) {
      label = 'Đang cộng Gold…';
    } else if (_loading) {
      label = 'Đang tải quảng cáo…';
    } else if (capReached) {
      label = 'Hết lượt hôm nay';
    } else if (ready) {
      label = 'Xem quảng cáo';
    } else {
      label = 'Thử tải lại quảng cáo';
    }

    return NeuCard(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: Text(AdConfig.creditGoldAfterView ? '🎬 Xem quảng cáo nhận Gold' : '🎬 Xem quảng cáo',
              style: headFont(size: 16)),
        ),
        if (status != null)
          Text('${status.remainingToday}/${status.dailyCap} lượt',
              style: monoFont(size: 12, color: Colors.grey.shade700)),
        if (status == null && _watched > 0)
          Text('đã xem $_watched', style: monoFont(size: 12, color: Colors.grey.shade700)),
      ]),
      const SizedBox(height: 6),
      Text(
        // Mức Gold lấy từ server; chưa tải được status thì nói chung chung, không bịa số.
        status != null
            ? 'Xem xong 1 video nhận ${formatNumber(status.goldPerView)} Gold.'
            : AdConfig.creditGoldAfterView
                ? 'Xem hết 1 video quảng cáo để nhận Gold.'
                : 'Xem hết 1 video quảng cáo. (Đang chạy quảng cáo thử — chưa cộng Gold.)',
        style: TextStyle(color: Colors.grey.shade600),
      ),
      if (_error != null) ...[
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Neu.pink.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Neu.ink, width: 2),
          ),
          child: Text(_error!, style: monoFont(size: 11)),
        ),
      ],
      const SizedBox(height: 12),
      NeuButton(
        label,
        expand: true,
        color: capReached ? Neu.white : Neu.green,
        textColor: capReached ? Neu.ink : Colors.white,
        loading: busy,
        onPressed: (busy || capReached) ? null : (ready ? _show : _load),
      ),
    ]));
  }
}
