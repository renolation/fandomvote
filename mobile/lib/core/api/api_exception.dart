// Lỗi nghiệp vụ chuẩn hoá từ envelope { error: { code, message } } — §0.6/§12.
class ApiException implements Exception {
  final String code;
  final String message;
  final int status;

  const ApiException(this.code, this.message, [this.status = 0]);

  @override
  String toString() => message;

  // Map mã lỗi backend → thông báo thân thiện tiếng Việt (§12).
  String get friendly {
    switch (code) {
      case 'INSUFFICIENT_BALANCE':
        return 'Không đủ điểm để thực hiện.';
      case 'GREEN_CAP_EXCEEDED':
        return 'Đã vượt trần Green trong ngày.';
      case 'CAMPAIGN_NOT_OPEN':
      case 'CAMPAIGN_CLOSED':
        return 'Chiến dịch chưa mở hoặc đã đóng.';
      case 'IDOL_DUPLICATE':
        return 'Idol đã tồn tại — hãy vote idol có sẵn.';
      case 'OUT_OF_STOCK':
        return 'Ưu đãi đã hết hàng.';
      case 'DEAL_INACTIVE':
        return 'Ưu đãi không còn hiệu lực.';
      case 'ALREADY_CLAIMED':
        return 'Bạn đã điểm danh hôm nay rồi.';
      case 'IN_PROGRESS':
        return 'Đang xử lý, vui lòng thử lại.';
      case 'REPLAY_DETECTED':
        return 'Yêu cầu trùng lặp bị chặn.';
      case 'SELF_REFERRAL':
        return 'Không thể tự giới thiệu chính mình.';
      case 'REFERRAL_LIMIT':
        return 'Đã đạt giới hạn lượt mời.';
      case 'INVALID_CREDENTIALS':
        return 'Sai thông tin đăng nhập.';
      case 'TOKEN_INVALID':
      case 'TOKEN_REUSE_DETECTED':
        return 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.';
      case 'ACCOUNT_FLAGGED':
        return 'Tài khoản đang bị khoá chi tiêu.';
      case 'RATE_LIMITED':
        return 'Quá nhiều yêu cầu, thử lại sau.';
      case 'NETWORK_ERROR':
        return 'Lỗi kết nối, kiểm tra mạng.';
      default:
        return message.isNotEmpty ? message : 'Đã có lỗi xảy ra.';
    }
  }
}
