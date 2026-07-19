import '../../core/json.dart';

// GET /wallet/balance → { green, gold, diamond }
class Balance {
  final int green;
  final int gold;
  final int diamond;
  const Balance(this.green, this.gold, this.diamond);

  factory Balance.fromJson(Map<String, dynamic> j) =>
      Balance(asInt(j['green']), asInt(j['gold']), asInt(j['diamond']));
}

// 1 dòng wallet_ledger
class LedgerEntry {
  final String id;
  final String currency; // GREEN | GOLD | DIAMOND
  final int amount;
  final String source;
  final String? expiresAt;
  final String createdAt;

  const LedgerEntry({
    required this.id,
    required this.currency,
    required this.amount,
    required this.source,
    this.expiresAt,
    required this.createdAt,
  });

  factory LedgerEntry.fromJson(Map<String, dynamic> j) => LedgerEntry(
        id: asString(j['id']),
        currency: asString(j['currency']),
        amount: asInt(j['amount']),
        source: asString(j['source']),
        expiresAt: asStrOrNull(j['expiresAt']),
        createdAt: asString(j['createdAt']),
      );
}

// GET /referrals/me → { referralCode (=userId), totalInvited, totalRewarded }
class Referral {
  final String referralCode;
  final int totalInvited;
  final int totalRewarded;
  const Referral(this.referralCode, this.totalInvited, this.totalRewarded);

  factory Referral.fromJson(Map<String, dynamic> j) => Referral(
        asString(j['referralCode']),
        asInt(j['totalInvited']),
        asInt(j['totalRewarded']),
      );
}

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? readAt;
  final String createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.readAt,
    required this.createdAt,
  });

  bool get unread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: asString(j['id']),
        type: asString(j['type']),
        title: asString(j['title']),
        body: asString(j['body']),
        readAt: asStrOrNull(j['readAt']),
        createdAt: asString(j['createdAt']),
      );
}

// 1 dòng hoạt động vote (GET /votes/activity)
class VoteActivity {
  final String id;
  final String currency;
  final int amount;
  final String? campaignId;
  final String createdAt;
  const VoteActivity({
    required this.id,
    required this.currency,
    required this.amount,
    this.campaignId,
    required this.createdAt,
  });

  factory VoteActivity.fromJson(Map<String, dynamic> j) => VoteActivity(
        id: asString(j['id']),
        currency: asString(j['currency']),
        amount: asInt(j['amount']),
        campaignId: asStrOrNull(j['campaignId']),
        createdAt: asString(j['createdAt']),
      );
}
