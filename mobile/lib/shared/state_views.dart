import 'package:flutter/material.dart';
import '../core/api/api_exception.dart';
import '../core/theme.dart';

class Loading extends StatelessWidget {
  const Loading({super.key});
  @override
  Widget build(BuildContext context) =>
      const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator(color: Neu.ink)));
}

class EmptyState extends StatelessWidget {
  final String message;
  final Widget? action;
  const EmptyState(this.message, {super.key, this.action});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(message, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
          if (action != null) Padding(padding: const EdgeInsets.only(top: 12), child: action!),
        ]),
      );
}

class ErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  const ErrorState(this.error, {super.key, this.onRetry});
  @override
  Widget build(BuildContext context) {
    final msg = error is ApiException ? (error as ApiException).friendly : 'Đã có lỗi xảy ra.';
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('⚠ $msg', textAlign: TextAlign.center, style: headFont(size: 14, color: Neu.pink)),
        if (onRetry != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: TextButton(onPressed: onRetry, child: const Text('Thử lại')),
          ),
      ]),
    );
  }
}

// Snackbar lỗi thống nhất (map ApiException.friendly).
void showError(BuildContext context, Object error) {
  final msg = error is ApiException ? error.friendly : error.toString();
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Neu.pink));
}

void showOk(BuildContext context, String msg) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Neu.green));
}
