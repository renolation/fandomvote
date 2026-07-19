// Cấu hình runtime (override bằng --dart-define lúc build/run).
// vd: flutter run --dart-define=API_BASE_URL=https://backend.fandomvote.com/api/v1
class Env {
  // Backend API base — SỬA THẲNG Ở ĐÂY, không cần --dart-define.
  static const String apiBaseUrl = 'https://backend.fandomvote.com/api/v1';
  // Khi dev local, đổi dòng trên thành:
  //   iOS simulator / web:   'http://localhost:8001/api/v1'
  //   Android emulator:      'http://10.0.2.2:8001/api/v1'   (emulator không thấy localhost của máy)

  // Google OAuth client id — dán client id vào để bật nút đăng nhập Google (để trống → ẩn nút).
  static const String googleClientId = '';

  // Chu kỳ poll leaderboard/balance/notification (§1).
  static const Duration pollInterval = Duration(seconds: 8);
}
