import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';

final dealsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).deals());
final iapProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).iapPackages());
final liveOffersProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).liveOffers());
final dailyRewardProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).dailyReward());
final dailyStatusProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).dailyStatus());
// Cấu hình + hạn mức xem quảng cáo nhận Gold (server là nguồn sự thật cho số Gold).
final adStatusProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).adStatus());
