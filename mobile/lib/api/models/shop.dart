import '../../core/json.dart';

class Deal {
  final String id;
  final String title;
  final int cost;
  final String currency; // GOLD|DIAMOND
  final String itemType; // DIGITAL|PHYSICAL
  final int stock;
  final int stockSold;

  const Deal({
    required this.id,
    required this.title,
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
