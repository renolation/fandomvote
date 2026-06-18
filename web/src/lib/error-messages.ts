import { ApiError } from './api-client';

// Map mã lỗi backend → thông báo tiếng Việt thân thiện (§12 web.CLAUDE.md).
const MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: 'Số dư không đủ.',
  GREEN_CAP_EXCEEDED: 'Đã vượt trần Green nhận trong ngày.',
  CAMPAIGN_NOT_OPEN: 'Chiến dịch chưa mở để vote.',
  CAMPAIGN_CLOSED: 'Chiến dịch đã đóng.',
  IDOL_DUPLICATE: 'Idol đã tồn tại — hãy vote idol có sẵn.',
  OUT_OF_STOCK: 'Sản phẩm đã hết hàng.',
  DEAL_INACTIVE: 'Ưu đãi đã ngừng.',
  ALREADY_CLAIMED: 'Hôm nay bạn đã điểm danh rồi.',
  IN_PROGRESS: 'Yêu cầu đang được xử lý, vui lòng thử lại.',
  REPLAY_DETECTED: 'Giao dịch đã được xử lý trước đó.',
  SELF_REFERRAL: 'Không thể tự giới thiệu chính mình.',
  REFERRAL_LIMIT: 'Đã đạt giới hạn lượt mời được thưởng.',
  INVALID_CREDENTIALS: 'Sai email/SĐT hoặc mật khẩu.',
  TOKEN_INVALID: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.',
  TOKEN_REUSE_DETECTED: 'Phát hiện bất thường phiên đăng nhập, vui lòng đăng nhập lại.',
  ACCOUNT_FLAGGED: 'Tài khoản đang bị tạm khoá chi tiêu.',
  INVALID_STATE: 'Thao tác không hợp lệ ở trạng thái hiện tại.',
  VALIDATION_ERROR: 'Dữ liệu nhập chưa hợp lệ.',
  FORBIDDEN: 'Bạn không có quyền thực hiện.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  RATE_LIMITED: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
  NETWORK_ERROR: 'Lỗi kết nối, vui lòng thử lại.',
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return MESSAGES[err.code] ?? err.message ?? 'Đã có lỗi xảy ra.';
  if (err instanceof Error) return err.message;
  return 'Đã có lỗi xảy ra.';
}
