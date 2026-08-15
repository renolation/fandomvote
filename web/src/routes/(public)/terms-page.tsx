import { LegalDocumentView } from './legal-document-view';
import { TERMS_EN, TERMS_VI } from './terms-content';

// /terms — Apple yêu cầu có Điều khoản sử dụng khi app bán hàng trong ứng dụng (IAP).
// Nội dung ở terms-content.ts.
export function TermsPage() {
  return (
    <LegalDocumentView
      vi={TERMS_VI}
      en={TERMS_EN}
      otherPage={{ to: '/privacy-policy', labelVi: 'Chính sách quyền riêng tư', labelEn: 'Privacy Policy' }}
    />
  );
}
