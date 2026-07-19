import 'package:uuid/uuid.dart';
import '../core/api/dio_client.dart';
import '../core/json.dart';
import 'models/auth.dart';
import 'models/wallet.dart';
import 'models/campaign.dart';
import 'models/shop.dart';

// Gom mọi lời gọi API. Trả model đã parse; ApiClient đã unwrap { data } + ném ApiException.
class ApiService {
  final ApiClient _c;
  const ApiService(this._c);

  static const _uuid = Uuid();
  String newIdempotencyKey() => _uuid.v4();

  Map<String, dynamic> _map(dynamic v) => (v as Map).cast<String, dynamic>();
  List<Map<String, dynamic>> _list(dynamic v) {
    if (v is Map && v['items'] is List) return asMapList(v['items']); // paginated → lấy items
    return asMapList(v);
  }

  // ---------- Auth ----------
  Future<AuthResult> register({
    String? email,
    String? phone,
    required String password,
    required String displayName,
    String? referralCode,
  }) async {
    final r = await _c.post('/auth/register', body: {
      if (email != null && email.isNotEmpty) 'email': email,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'password': password,
      'displayName': displayName,
      if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
    });
    return AuthResult.fromJson(_map(r));
  }

  Future<AuthResult> login({String? email, String? phone, required String password}) async {
    final r = await _c.post('/auth/login', body: {
      if (email != null && email.isNotEmpty) 'email': email,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'password': password,
    });
    return AuthResult.fromJson(_map(r));
  }

  Future<AuthResult> google({required String idToken, String? referralCode}) async {
    final r = await _c.post('/auth/google', body: {
      'idToken': idToken,
      if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
    });
    return AuthResult.fromJson(_map(r));
  }

  Future<AuthUser> me() async => AuthUser.fromJson(_map(await _c.get('/auth/me')));
  Future<void> logout(String refreshToken) => _c.post('/auth/logout', body: {'refreshToken': refreshToken});
  Future<void> verifyRequest(String channel) => _c.post('/auth/verify/request', body: {'channel': channel});
  Future<void> verifyConfirm(String channel, String otp) =>
      _c.post('/auth/verify/confirm', body: {'channel': channel, 'otp': otp});
  Future<AuthUser> updateProfile(Map<String, dynamic> patch) async =>
      AuthUser.fromJson(_map(await _c.post('/auth/profile', body: patch)));

  // ---------- Wallet ----------
  Future<Balance> balance() async => Balance.fromJson(_map(await _c.get('/wallet/balance')));
  Future<Paginated<LedgerEntry>> ledger({String? cursor}) async =>
      Paginated.from(await _c.get('/wallet/ledger', query: {'cursor': cursor}), LedgerEntry.fromJson);
  Future<void> convertDiamond(int diamonds) =>
      _c.post('/wallet/convert-diamond', body: {'diamonds': diamonds}, idempotencyKey: newIdempotencyKey());

  // ---------- Vote ----------
  Future<VoteResult> vote({required String campaignIdolId, required int amount, required String idempotencyKey}) async {
    final r = await _c.post('/votes', body: {'campaignIdolId': campaignIdolId, 'amount': amount}, idempotencyKey: idempotencyKey);
    return VoteResult.fromJson(_map(r));
  }

  Future<Paginated<VoteActivity>> voteActivity({String? cursor}) async =>
      Paginated.from(await _c.get('/votes/activity', query: {'cursor': cursor}), VoteActivity.fromJson);

  // ---------- Campaign ----------
  Future<List<Campaign>> campaigns({String? status}) async =>
      _list(await _c.get('/campaigns', query: {'status': status})).map(Campaign.fromJson).toList();
  Future<Campaign> campaign(String id) async => Campaign.fromJson(_map(await _c.get('/campaigns/$id')));
  Future<List<LeaderboardEntry>> leaderboard(String id, {String? period}) async =>
      _list(await _c.get('/campaigns/$id/leaderboard', query: {'period': period})).map(LeaderboardEntry.fromJson).toList();
  Future<CampaignResult> result(String id) async => CampaignResult.fromJson(_map(await _c.get('/campaigns/$id/result')));
  Future<void> addIdolToCampaign(String campaignId, String idolId) =>
      _c.post('/campaigns/$campaignId/idols', body: {'idolId': idolId});

  // ---------- Idol ----------
  Future<List<Idol>> idols({String? search}) async =>
      _list(await _c.get('/idols', query: {'search': search})).map(Idol.fromJson).toList();
  Future<List<Idol>> myNominations() async => _list(await _c.get('/idols/mine')).map(Idol.fromJson).toList();
  Future<DuplicateCheck> checkIdol(String name) async =>
      DuplicateCheck.fromJson(_map(await _c.get('/idols/check', query: {'name': name})));
  Future<Idol> nominate({required String name, String? avatarUrl}) async {
    final r = await _c.post('/idols/nominate', body: {'name': name, if (avatarUrl != null) 'avatarUrl': avatarUrl});
    return Idol.fromJson(_map(r));
  }

  // ---------- Referral ----------
  Future<Referral> referralMe() async => Referral.fromJson(_map(await _c.get('/referrals/me')));

  // ---------- Shop ----------
  Future<List<Deal>> deals() async => _list(await _c.get('/shop/deals')).map(Deal.fromJson).toList();
  Future<void> redeemDeal(String id) => _c.post('/shop/deals/$id/redeem', idempotencyKey: newIdempotencyKey());
  Future<List<DailyRewardTier>> dailyReward() async =>
      _list(await _c.get('/shop/daily-reward')).map(DailyRewardTier.fromJson).toList();
  Future<bool> dailyClaimedToday() async {
    final r = await _c.get('/shop/daily-reward/status');
    return asBool(_map(r)['claimedToday']);
  }

  Future<void> claimDaily() => _c.post('/shop/daily-reward/claim');
  Future<List<IapPackage>> iapPackages() async => _list(await _c.get('/shop/iap-packages')).map(IapPackage.fromJson).toList();
  Future<List<LiveOffer>> liveOffers() async => _list(await _c.get('/shop/offers/live')).map(LiveOffer.fromJson).toList();
  Future<List<GiftItem>> gifts() async => _list(await _c.get('/shop/gifts')).map(GiftItem.fromJson).toList();
  Future<void> useGift(String id) => _c.post('/shop/gifts/$id/use');
  Future<void> confirmGift(String id, String addressId) =>
      _c.post('/shop/gifts/$id/confirm', body: {'shippingAddressId': addressId});
  Future<List<ShippingAddress>> addresses() async =>
      _list(await _c.get('/shop/addresses')).map(ShippingAddress.fromJson).toList();
  Future<void> createAddress(Map<String, dynamic> body) => _c.post('/shop/addresses', body: body);

  // ---------- Events ----------
  Future<List<PointEvent>> activeEvents() async => _list(await _c.get('/events/active')).map(PointEvent.fromJson).toList();

  // ---------- Notification ----------
  Future<Paginated<AppNotification>> notifications({String? cursor}) async =>
      Paginated.from(await _c.get('/notifications', query: {'cursor': cursor}), AppNotification.fromJson);
  Future<int> unreadCount() async {
    final r = await _c.get('/notifications/unread-count');
    return (r is Map) ? asInt(r['count']) : asInt(r);
  }

  Future<void> markRead(String id) => _c.patch('/notifications/$id/read');
  Future<void> markAllRead() => _c.patch('/notifications/read-all');
}
