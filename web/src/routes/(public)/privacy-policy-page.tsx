import { LegalDocumentView } from './legal-document-view';
import { POLICY_EN, POLICY_VI } from './privacy-policy-content';

// /privacy-policy — link nộp cho Google Play và App Store. Nội dung ở privacy-policy-content.ts.
export function PrivacyPolicyPage() {
  return (
    <LegalDocumentView
      vi={POLICY_VI}
      en={POLICY_EN}
      otherPage={{ to: '/terms', labelVi: 'Điều khoản sử dụng', labelEn: 'Terms of Service' }}
    />
  );
}
