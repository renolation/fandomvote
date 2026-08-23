# ── Room / WorkManager ────────────────────────────────────────────────────────
# google_mobile_ads kéo theo WorkManager (ping quảng cáo offline). WorkManager dùng Room,
# mà Room nạp lớp sinh tự động bằng TÊN: Class.forName("WorkDatabase" + "_Impl").
# R8 đổi tên/xoá lớp đó → "Failed to create an instance of androidx.work.impl.WorkDatabase"
# → app chết ngay lúc khởi động, trước cả khi Flutter chạy.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class **_Impl extends androidx.room.RoomDatabase { <init>(); }
-keepclassmembers class * extends androidx.room.RoomDatabase { public <init>(); }
-keep class androidx.work.** { *; }
-keep class androidx.startup.** { *; }
-dontwarn androidx.work.**

# ── Google Mobile Ads ─────────────────────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# ── Flutter plugin dùng reflection ────────────────────────────────────────────
-keep class io.flutter.** { *; }
-dontwarn io.flutter.embedding.**
