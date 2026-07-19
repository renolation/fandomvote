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
