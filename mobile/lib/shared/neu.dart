import 'package:flutter/material.dart';
import '../core/theme.dart';

// Nút neubrutalism: press → khối "lún" theo offset shadow (§9).
class NeuButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color color;
  final Color textColor;
  final bool loading;
  final bool expand;
  final IconData? icon;

  const NeuButton(
    this.label, {
    super.key,
    this.onPressed,
    this.color = Neu.yellow,
    this.textColor = Neu.ink,
    this.loading = false,
    this.expand = false,
    this.icon,
  });

  @override
  State<NeuButton> createState() => _NeuButtonState();
}

class _NeuButtonState extends State<NeuButton> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null && !widget.loading;
    final pressed = _down && enabled;
    return GestureDetector(
      onTapDown: enabled ? (_) => setState(() => _down = true) : null,
      onTapUp: enabled ? (_) => setState(() => _down = false) : null,
      onTapCancel: enabled ? () => setState(() => _down = false) : null,
      onTap: enabled ? widget.onPressed : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 60),
        width: widget.expand ? double.infinity : null,
        transform: Matrix4.translationValues(pressed ? 3 : 0, pressed ? 3 : 0, 0),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: enabled ? widget.color : widget.color.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Neu.ink, width: 3),
          boxShadow: pressed ? null : Neu.shadow(3),
        ),
        child: Row(
          mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.loading)
              const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Neu.ink))
            else if (widget.icon != null) ...[
              Icon(widget.icon, size: 18, color: widget.textColor),
              const SizedBox(width: 8),
            ],
            Text(widget.label, style: headFont(size: 14, color: widget.textColor)),
          ],
        ),
      ),
    );
  }
}

class NeuCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color bg;
  final double shadowOffset;
  const NeuCard(this.child, {super.key, this.padding = const EdgeInsets.all(16), this.bg = Neu.white, this.shadowOffset = 4});

  @override
  Widget build(BuildContext context) =>
      Container(padding: padding, decoration: Neu.box(bg: bg, shadowOffset: shadowOffset), child: child);
}

class NeuPill extends StatelessWidget {
  final String text;
  final Color color;
  final Color textColor;
  const NeuPill(this.text, {super.key, this.color = Neu.yellow, this.textColor = Neu.ink});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20), border: Border.all(color: Neu.ink, width: 2)),
        child: Text(text, style: monoFont(size: 11, color: textColor)),
      );
}

class NeuField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? hint;
  final ValueChanged<String>? onChanged;
  const NeuField(this.label, this.controller,
      {super.key, this.obscure = false, this.keyboardType, this.hint, this.onChanged});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: const EdgeInsets.only(bottom: 6, top: 10), child: Text(label, style: headFont(size: 13))),
          TextField(
            controller: controller,
            obscureText: obscure,
            keyboardType: keyboardType,
            onChanged: onChanged,
            style: monoFont(size: 15, weight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              filled: true,
              fillColor: Neu.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Neu.ink, width: 3)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Neu.blue, width: 3)),
            ),
          ),
        ],
      );
}
