import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';

final dealsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).deals());
final iapProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).iapPackages());
final liveOffersProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).liveOffers());
final dailyRewardProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).dailyReward());
final dailyStatusProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).dailyStatus());
