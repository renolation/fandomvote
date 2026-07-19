import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Flat Neubrutalism — §9. Hard shadow (không blur), viền đen 2–3px, phẳng.
class Neu {
  static const ink = Color(0xFF0A0A0A);
  static const yellow = Color(0xFFFFD60A);
  static const blue = Color(0xFF3B82F6);
  static const green = Color(0xFF22C55E);
  static const pink = Color(0xFFFB7185);
  static const cream = Color(0xFFFAF7F0);
  static const white = Colors.white;

  static List<BoxShadow> shadow([double offset = 4]) =>
      [BoxShadow(color: ink, offset: Offset(offset, offset), blurRadius: 0)];

  static BoxDecoration box({
    Color bg = white,
    double radius = 12,
    double border = 3,
    double shadowOffset = 4,
  }) =>
      BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: ink, width: border),
        boxShadow: shadowOffset > 0 ? shadow(shadowOffset) : null,
      );
}

TextStyle headFont({double size = 16, FontWeight weight = FontWeight.w700, Color color = Neu.ink}) =>
    GoogleFonts.spaceGrotesk(fontSize: size, fontWeight: weight, color: color);

TextStyle monoFont({double size = 14, FontWeight weight = FontWeight.w700, Color color = Neu.ink}) =>
    GoogleFonts.jetBrainsMono(fontSize: size, fontWeight: weight, color: color);

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: Neu.cream,
    colorScheme: ColorScheme.fromSeed(seedColor: Neu.yellow, primary: Neu.ink),
  );
  return base.copyWith(textTheme: GoogleFonts.interTextTheme(base.textTheme));
}
