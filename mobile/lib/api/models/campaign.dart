import '../../core/json.dart';

class Campaign {
  final String id;
  final String title;
  final String? description;
  final String? rulesContent;
  final String? prize;
  final int starGoal;
  final int donationRatioBps;
  final String status; // DRAFT|OPEN|CLOSED|RESOLVING|RESOLVED|ARCHIVED
  final String? openAt;
  final String? closeAt;

  const Campaign({
    required this.id,
    required this.title,
    this.description,
    this.rulesContent,
    this.prize,
    required this.starGoal,
    required this.donationRatioBps,
    required this.status,
    this.openAt,
    this.closeAt,
  });

  bool get isOpen => status == 'OPEN';
  bool get isEnded => status == 'CLOSED' || status == 'RESOLVING' || status == 'RESOLVED' || status == 'ARCHIVED';

  factory Campaign.fromJson(Map<String, dynamic> j) => Campaign(
        id: asString(j['id']),
        title: asString(j['title']),
        description: asStrOrNull(j['description']),
        rulesContent: asStrOrNull(j['rulesContent']),
        prize: asStrOrNull(j['prize']),
        starGoal: asInt(j['starGoal']),
        donationRatioBps: asInt(j['donationRatioBps']),
        status: asString(j['status']),
        openAt: asStrOrNull(j['openAt']),
        closeAt: asStrOrNull(j['closeAt']),
      );
}

// GET /campaigns/:id/leaderboard
class LeaderboardEntry {
  final String campaignIdolId;
  final String idolId;
  final String name;
  final String? avatarUrl;
  final int totalVotes;
  final String? reachedValueAt;

  const LeaderboardEntry({
    required this.campaignIdolId,
    required this.idolId,
    required this.name,
    this.avatarUrl,
    required this.totalVotes,
    this.reachedValueAt,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> j) => LeaderboardEntry(
        campaignIdolId: asString(j['campaignIdolId']),
        idolId: asString(j['idolId']),
        name: asString(j['name']),
        avatarUrl: asStrOrNull(j['avatarUrl']),
        totalVotes: asInt(j['totalVotes']),
        reachedValueAt: asStrOrNull(j['reachedValueAt']),
      );
}

// POST /votes → { greenSpent, goldSpent, newTotal, balance }
class VoteResult {
  final int greenSpent;
  final int goldSpent;
  final int newTotal;
  const VoteResult(this.greenSpent, this.goldSpent, this.newTotal);

  factory VoteResult.fromJson(Map<String, dynamic> j) =>
      VoteResult(asInt(j['greenSpent']), asInt(j['goldSpent']), asInt(j['newTotal']));
}

// GET /campaigns/:id/result → { campaign, snapshot[], receipt }
class ResultReceipt {
  final int goldVoted;
  final int donatedVnd;
  const ResultReceipt(this.goldVoted, this.donatedVnd);
  factory ResultReceipt.fromJson(Map<String, dynamic> j) =>
      ResultReceipt(asInt(j['goldVoted']), asInt(j['donatedVnd']));
}

class CampaignResult {
  final Campaign campaign;
  final List<LeaderboardEntry> snapshot;
  final ResultReceipt? receipt;
  const CampaignResult(this.campaign, this.snapshot, this.receipt);

  factory CampaignResult.fromJson(Map<String, dynamic> j) => CampaignResult(
        Campaign.fromJson((j['campaign'] as Map).cast<String, dynamic>()),
        asMapList(j['snapshot']).map(LeaderboardEntry.fromJson).toList(),
        j['receipt'] == null ? null : ResultReceipt.fromJson((j['receipt'] as Map).cast<String, dynamic>()),
      );
}

// ---- Idol ----
class Idol {
  final String id;
  final String name;
  final String? avatarUrl;
  final String status; // PENDING|APPROVED|REJECTED
  final String? bio;

  const Idol({required this.id, required this.name, this.avatarUrl, required this.status, this.bio});

  factory Idol.fromJson(Map<String, dynamic> j) => Idol(
        id: asString(j['id']),
        name: asString(j['name']),
        avatarUrl: asStrOrNull(j['avatarUrl']),
        status: asString(j['status'], 'PENDING'),
        bio: asStrOrNull(j['bio']),
      );
}

class DuplicateCheck {
  final bool duplicate;
  final Idol? idol;
  const DuplicateCheck(this.duplicate, this.idol);

  factory DuplicateCheck.fromJson(Map<String, dynamic> j) => DuplicateCheck(
        asBool(j['duplicate']),
        j['idol'] == null ? null : Idol.fromJson((j['idol'] as Map).cast<String, dynamic>()),
      );
}
