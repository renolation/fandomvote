// Hằng số + kiểu dùng chung cho các trang pháp lý (privacy policy, terms).
// SỬA 3 giá trị dưới đây trước khi nộp store.

/** Hòm thư nhận yêu cầu về dữ liệu cá nhân + xoá tài khoản. PHẢI có người đọc thật. */
export const LEGAL_CONTACT_EMAIL = 'support@fdv.vn';

/** Tên đơn vị vận hành. Nên dùng tên pháp nhân đầy đủ khi nộp App Store. */
export const LEGAL_OPERATOR = 'FandomVote';

export const LEGAL_EFFECTIVE_DATE = { vi: '15/08/2026', en: 'August 15, 2026' };

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PolicyDoc {
  title: string;
  /** Nhãn "Ngày hiệu lực" / "Effective date". */
  effectiveLabel: string;
  intro: string[];
  sections: PolicySection[];
}
