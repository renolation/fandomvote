import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/models/campaign.dart';
import '../../../core/env.dart';
import '../../../core/providers.dart';

// Chiến dịch đã kết thúc (để xem kết quả) + kết quả 1 campaign.
final endedCampaignsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).campaigns(status: 'RESOLVED'));
final campaignResultProvider =
    FutureProvider.autoDispose.family((ref, String id) => ref.watch(apiProvider).result(id));

// Chỉ campaign OPEN (bình chọn được) — poll 5–10s.
final campaignsProvider = StreamProvider.autoDispose<List<Campaign>>((ref) async* {
  final api = ref.watch(apiProvider);
  List<Campaign>? last;
  while (true) {
    try {
      last = await api.campaigns(status: 'OPEN');
      yield last;
    } catch (e) {
      if (last == null) rethrow;
    }
    await Future.delayed(Env.pollInterval);
  }
});

// Campaign hẹn giờ chưa tới open_at. Backend đã loại khỏi ?status=OPEN nên phải lấy danh sách đầy đủ
// rồi lọc theo isUpcoming; sắp xếp theo giờ mở gần nhất trước.
final upcomingCampaignsProvider = FutureProvider.autoDispose<List<Campaign>>((ref) async {
  final all = await ref.watch(apiProvider).campaigns();
  final upcoming = all.where((c) => c.isUpcoming).toList();
  upcoming.sort((a, b) => (a.openAt ?? '').compareTo(b.openAt ?? ''));
  return upcoming;
});

final leaderboardProvider =
    StreamProvider.autoDispose.family<List<LeaderboardEntry>, String>((ref, campaignId) async* {
  final api = ref.watch(apiProvider);
  List<LeaderboardEntry>? last;
  while (true) {
    try {
      last = await api.leaderboard(campaignId);
      yield last;
    } catch (e) {
      if (last == null) rethrow;
    }
    await Future.delayed(Env.pollInterval);
  }
});
