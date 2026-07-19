import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers.dart';

final referralProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).referralMe());
final giftsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).gifts());
final myNominationsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).myNominations());
final ledgerProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).ledger());
final voteActivityProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).voteActivity());
final notificationsProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).notifications());
final addressesProvider = FutureProvider.autoDispose((ref) => ref.watch(apiProvider).addresses());
