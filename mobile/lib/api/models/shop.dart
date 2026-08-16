import '../../core/json.dart';

class Deal {
  final String id;
  final String title;
  final String? imageUrl; // null → vẽ ô màu theo id
  final int cost;
  final String currency; // GOLD|DIAMOND
  final String itemType; // DIGITAL|PHYSICAL
  final int stock;
  final int stockSold;

  const Deal({
    required this.id,
    required this.title,
    this.imageUrl,
    required this.cost,
    required this.currency,
    required this.itemType,
    required this.stock,
    required this.stockSold,
  });

  int get remaining => (stock - stockSold).clamp(0, stock);
  bool get soldOut => remaining <= 0;

  factory Deal.fromJson(Map<String, dynamic> j) => Deal(
        id: asString(j['id']),
        title: asString(j['title']),
        imageUrl: asStrOrNull(j['imageUrl']),
        cost: asInt(j['cost']),
        currency: asString(j['currency'], 'GOLD'),
        itemType: asString(j['itemType'], 'DIGITAL'),
        stock: asInt(j['stock']),
        stockSold: asInt(j['stockSold']),
      );
}

class DailyRewardTier {
  final int dayIndex;
  final int greenAmount;
  const DailyRewardTier(this.dayIndex, this.greenAmount);
  factory DailyRewardTier.fromJson(Map<String, dynamic> j) =>
      DailyRewardTier(asInt(j['dayIndex']), asInt(j['greenAmount']));
}

// Trạng thái điểm danh: dayIndex = ngày chuỗi đã nhận hôm nay, hoặc ngày sẽ nhận nếu điểm danh bây giờ.
class DailyStatus {
  final bool claimedToday;
  final int dayIndex;
  const DailyStatus({required this.claimedToday, required this.dayIndex});
}

// Bật/tắt từng loại quảng cáo — do admin đặt trên web, app đọc theo (không cần update app).
class AdFormatFlags {
  final bool rewarded;
  final bool rewardedInterstitial;
  final bool interstitial;
  final bool banner;
  final bool appOpen;
  final bool native;

  const AdFormatFlags({
    this.rewarded = false,
    this.rewardedInterstitial = false,
    this.interstitial = false,
    this.banner = false,
    this.appOpen = false,
    this.native = false,
  });

  factory AdFormatFlags.fromJson(Map<String, dynamic> j) => AdFormatFlags(
        rewarded: asBool(j['rewarded']),
        rewardedInterstitial: asBool(j['rewardedInterstitial']),
        interstitial: asBool(j['interstitial']),
        banner: asBool(j['banner']),
        appOpen: asBool(j['appOpen']),
        native: asBool(j['native']),
      );
}

// Xem rewarded ad nhận Gold. Số Gold do SERVER tính (giá 1 lượt × tỉ lệ admin đặt) — client chỉ hiển thị.
class AdRewardStatus {
  final int goldPerView;
  final int valueVnd; // giá trị 1 lượt xem (VND)
  final int ratioBps; // tỉ lệ trả về user: 10000 = 100%
  final int dailyCap;
  final int cooldownSeconds;
  final int rewardedInterstitialGapSeconds; // giãn cách giữa 2 lần mời sau khi vote
  final int viewsToday;
  final int? remainingToday; // null = không giới hạn lượt/ngày
  final String? nextAvailableAt; // còn cooldown → thời điểm được xem tiếp
  final AdFormatFlags formats;

  const AdRewardStatus({
    required this.goldPerView,
    required this.valueVnd,
    required this.ratioBps,
    required this.dailyCap,
    required this.cooldownSeconds,
    this.rewardedInterstitialGapSeconds = 300,
    required this.viewsToday,
    this.remainingToday,
    this.nextAvailableAt,
    this.formats = const AdFormatFlags(),
  });

  factory AdRewardStatus.fromJson(Map<String, dynamic> j) => AdRewardStatus(
        goldPerView: asInt(j['goldPerView']),
        valueVnd: asInt(j['valueVnd']),
        ratioBps: asInt(j['ratioBps']),
        dailyCap: asInt(j['dailyCap']),
        cooldownSeconds: asInt(j['cooldownSeconds']),
        rewardedInterstitialGapSeconds: asInt(j['rewardedInterstitialGapSeconds'], 300),
        viewsToday: asInt(j['viewsToday']),
        remainingToday: asIntOrNull(j['remainingToday']),
        nextAvailableAt: asStrOrNull(j['nextAvailableAt']),
        formats: AdFormatFlags.fromJson(
          (j['formats'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{},
        ),
      );
}

// Kết quả sau khi xem xong 1 lượt (server đã ghi ledger).
class AdRewardResult {
  final int goldAwarded;
  final int? remainingToday; // null = không giới hạn
  const AdRewardResult(this.goldAwarded, this.remainingToday);

  factory AdRewardResult.fromJson(Map<String, dynamic> j) =>
      AdRewardResult(asInt(j['goldAwarded']), asIntOrNull(j['remainingToday']));
}

class IapPackage {
  final String id;
  final String sku;
  final String title;
  final int diamondAmount;
  final int bonusDiamond;
  final int priceVnd;

  const IapPackage({
    required this.id,
    required this.sku,
    required this.title,
    required this.diamondAmount,
    required this.bonusDiamond,
    required this.priceVnd,
  });

  int get total => diamondAmount + bonusDiamond;

  factory IapPackage.fromJson(Map<String, dynamic> j) => IapPackage(
        id: asString(j['id']),
        sku: asString(j['sku']),
        title: asString(j['title']),
        diamondAmount: asInt(j['diamondAmount']),
        bonusDiamond: asInt(j['bonusDiamond']),
        priceVnd: asInt(j['priceVnd']),
      );
}

// GET /shop/offers/live (Lootably native) — hoặc offer tĩnh fallback.
class LiveOffer {
  final String id;
  final String title;
  final int rewardGold;
  final String? imageUrl;
  final String? actionUrl;
  final String? icon;
  final String? iconBg;

  const LiveOffer({
    required this.id,
    required this.title,
    required this.rewardGold,
    this.imageUrl,
    this.actionUrl,
    this.icon,
    this.iconBg,
  });

  factory LiveOffer.fromJson(Map<String, dynamic> j) => LiveOffer(
        id: asString(j['id']),
        title: asString(j['title']),
        rewardGold: asInt(j['rewardGold']),
        imageUrl: asStrOrNull(j['imageUrl']),
        actionUrl: asStrOrNull(j['actionUrl']),
        icon: asStrOrNull(j['icon']),
        iconBg: asStrOrNull(j['iconBg']),
      );
}

class GiftItem {
  final String id;
  final String itemType; // DIGITAL|PHYSICAL
  final String status;
  final String? code;
  final String? expiresAt;

  const GiftItem({required this.id, required this.itemType, required this.status, this.code, this.expiresAt});

  factory GiftItem.fromJson(Map<String, dynamic> j) => GiftItem(
        id: asString(j['id']),
        itemType: asString(j['itemType'], 'DIGITAL'),
        status: asString(j['status']),
        code: asStrOrNull(j['code']),
        expiresAt: asStrOrNull(j['expiresAt']),
      );
}

class ShippingAddress {
  final String id;
  final String recipient;
  final String phone;
  final String line1;
  const ShippingAddress({required this.id, required this.recipient, required this.phone, required this.line1});
  factory ShippingAddress.fromJson(Map<String, dynamic> j) => ShippingAddress(
        id: asString(j['id']),
        recipient: asString(j['recipient']),
        phone: asString(j['phone']),
        line1: asString(j['line1']),
      );
}

// GET /events/active — banner point event
class PointEvent {
  final String id;
  final String title;
  final String type; // EARN_MULTIPLIER|TOPUP_MULTIPLIER
  final int multiplierBps;
  final String? endsAt;
  final String? bannerText;

  const PointEvent({
    required this.id,
    required this.title,
    required this.type,
    required this.multiplierBps,
    this.endsAt,
    this.bannerText,
  });

  double get multiplier => multiplierBps / 10000.0;

  factory PointEvent.fromJson(Map<String, dynamic> j) => PointEvent(
        id: asString(j['id']),
        title: asString(j['title']),
        type: asString(j['type']),
        multiplierBps: asInt(j['multiplierBps']),
        endsAt: asStrOrNull(j['endsAt']),
        bannerText: asStrOrNull(j['bannerText']),
      );
}
