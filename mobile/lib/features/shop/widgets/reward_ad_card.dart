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
    if (!kIsWeb && AdConfig.rewardedHasUnit) _waitEnabledThenLoad();
  }

  // Admin (web) bật/tắt rewarded qua platform_config → app hỏi server trước khi nạp.
  // Không lấy được cấu hình (offline/backend lỗi) → không nạp: đằng nào cũng không cộng Gold được.
  Future<void> _waitEnabledThenLoad() async {
    try {
      final status = await ref.read(adStatusProvider.future);
      if (!status.formats.rewarded) return;
    } catch (_) {
      return;
    }
    if (mounted) _load();
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
        final left = r.remainingToday; // null = không giới hạn lượt/ngày
        showOk(
          context,
          left == null
              ? '+${formatNumber(r.goldAwarded)} Gold'
              : '+${formatNumber(r.goldAwarded)} Gold · còn $left lượt hôm nay',
        );
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

    final status = ref.watch(adStatusProvider).valueOrNull;
    // Ẩn hẳn khi: chưa khai báo ad unit cho nền tảng này (vd iOS chưa tạo), chưa lấy được
    // cấu hình, hoặc admin đã TẮT rewarded trên web.
    if (!AdConfig.rewardedHasUnit || status == null || !status.formats.rewarded) {
      return const SizedBox.shrink();
    }
    // remainingToday null = server không đặt trần → không bao giờ khoá nút.
    final capReached = status.remainingToday != null && status.remainingToday! <= 0;
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
        // Chỉ hiện hạn mức khi server thực sự đặt trần.
        if (status.remainingToday != null)
          Text('${status.remainingToday}/${status.dailyCap} lượt',
              style: monoFont(size: 12, color: Colors.grey.shade700)),
        if (status.remainingToday == null && _watched > 0)
          Text('đã xem $_watched', style: monoFont(size: 12, color: Colors.grey.shade700)),
      ]),
      const SizedBox(height: 6),
      Text(
        // Mức Gold do server tính — client không bịa số.
        AdConfig.creditGoldAfterView
            ? 'Xem xong 1 video nhận ${formatNumber(status.goldPerView)} Gold.'
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
