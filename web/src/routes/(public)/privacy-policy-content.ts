// Nội dung Chính sách quyền riêng tư (VI + EN) — tách khỏi phần render.
// Mô tả đúng dữ liệu hệ thống đang xử lý: tài khoản, ví điểm/vote, đơn quà vật lý,
// ảnh tải lên (Cloudflare R2), quảng cáo AdMob, offerwall đối tác, IAP App Store/Google Play.
// Sửa nội dung ở file này; bố cục nằm ở privacy-policy-page.tsx.

import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR, type PolicyDoc } from './legal-common';

export const POLICY_VI: PolicyDoc = {
  title: 'Chính sách quyền riêng tư',
  effectiveLabel: 'Ngày hiệu lực',
  intro: [
    `Chính sách này giải thích ${LEGAL_OPERATOR} thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân của bạn như thế nào khi bạn dùng ứng dụng di động và website FandomVote ("Dịch vụ").`,
    'Khi tạo tài khoản và sử dụng Dịch vụ, bạn đồng ý với các nội dung mô tả tại đây.',
  ],
  sections: [
    {
      heading: '1. Dữ liệu chúng tôi thu thập',
      paragraphs: ['Chúng tôi chỉ thu thập dữ liệu cần thiết để vận hành Dịch vụ:'],
      bullets: [
        'Thông tin tài khoản: địa chỉ email, mật khẩu (lưu dưới dạng băm, chúng tôi không biết mật khẩu gốc), tên đăng nhập, tên hiển thị, fandom bạn khai báo và ảnh đại diện nếu bạn tải lên.',
        'Đăng nhập bằng Google: nếu bạn chọn đăng nhập bằng Google, chúng tôi nhận email, tên hiển thị và ảnh đại diện từ tài khoản Google của bạn. Chúng tôi không nhận và không lưu mật khẩu Google.',
        'Hoạt động trong Dịch vụ: lịch sử bình chọn, điểm danh hằng ngày, số dư và lịch sử biến động điểm (Green/Gold/Diamond), idol bạn theo dõi hoặc đề cử, quà đã đổi, thông báo.',
        'Đơn quà vật lý: khi đổi quà cần giao hàng, chúng tôi thu thập tên người nhận, số điện thoại và địa chỉ nhận hàng để giao quà.',
        'Giao dịch nạp: mã giao dịch do App Store hoặc Google Play cung cấp để xác nhận đơn nạp. Chúng tôi KHÔNG thu thập và không lưu số thẻ hay thông tin thanh toán của bạn.',
        'Dữ liệu kỹ thuật: địa chỉ IP, loại thiết bị và trình duyệt, thời điểm truy cập — ghi trong nhật ký máy chủ để bảo mật, chống gian lận và khắc phục sự cố.',
        'Ảnh bạn tải lên: ảnh đại diện, ảnh đề cử idol được lưu trên dịch vụ lưu trữ Cloudflare R2.',
      ],
    },
    {
      heading: '2. Quảng cáo và định danh quảng cáo',
      paragraphs: [
        'Dịch vụ hiển thị quảng cáo video có thưởng thông qua Google AdMob. Để phân phối, giới hạn tần suất và đo lường quảng cáo, AdMob có thể thu thập định danh quảng cáo của thiết bị và dữ liệu kỹ thuật liên quan theo chính sách riêng của Google.',
        'Khi bạn xem xong một quảng cáo, hệ thống của chúng tôi nhận thông tin xác nhận lượt xem để cộng điểm thưởng vào tài khoản. Chúng tôi không nhận nội dung cá nhân nào khác từ quảng cáo.',
        'Bạn có thể giới hạn quảng cáo cá nhân hoá trong phần cài đặt của thiết bị (Android: Cài đặt → Google → Quảng cáo; iOS: Cài đặt → Quyền riêng tư → Theo dõi).',
      ],
    },
    {
      heading: '3. Nhiệm vụ từ đối tác (offerwall)',
      paragraphs: [
        'Dịch vụ có thể hiển thị danh sách nhiệm vụ do đối tác cung cấp. Để hiện đúng nhiệm vụ khả dụng tại khu vực của bạn, chúng tôi gửi cho đối tác một mã định danh người dùng ẩn danh, địa chỉ IP và thông tin trình duyệt/thiết bị.',
        'Khi bạn hoàn thành nhiệm vụ, đối tác báo kết quả về máy chủ của chúng tôi để cộng điểm. Việc đối tác xử lý dữ liệu tuân theo chính sách quyền riêng tư của chính họ.',
      ],
    },
    {
      heading: '4. Mục đích sử dụng dữ liệu',
      bullets: [
        'Tạo và quản lý tài khoản, xác thực đăng nhập.',
        'Vận hành tính năng cốt lõi: bình chọn, bảng xếp hạng, ví điểm, đổi quà, thông báo.',
        'Giao quà vật lý tới đúng người nhận.',
        'Cộng điểm thưởng chính xác từ điểm danh, quảng cáo, nhiệm vụ đối tác và giới thiệu bạn bè.',
        'Phát hiện và ngăn chặn gian lận, lạm dụng, tạo tài khoản ảo.',
        'Hỗ trợ người dùng và xử lý khiếu nại.',
        'Tuân thủ nghĩa vụ pháp lý và yêu cầu hợp lệ của cơ quan có thẩm quyền.',
      ],
    },
    {
      heading: '5. Chia sẻ dữ liệu',
      paragraphs: ['Chúng tôi KHÔNG bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ trong các trường hợp sau:'],
      bullets: [
        'Google (Đăng nhập Google, AdMob): xác thực đăng nhập và phân phối quảng cáo.',
        'Apple App Store / Google Play: xử lý và xác nhận giao dịch nạp trong ứng dụng.',
        'Đối tác cung cấp nhiệm vụ (offerwall): như mô tả tại Mục 3.',
        'Nhà cung cấp hạ tầng: dịch vụ máy chủ, cơ sở dữ liệu và lưu trữ ảnh (Cloudflare R2) phục vụ vận hành Dịch vụ.',
        'Đơn vị vận chuyển: tên, số điện thoại và địa chỉ của bạn, chỉ khi bạn đổi quà cần giao hàng.',
        'Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.',
      ],
    },
    {
      heading: '6. Bảo mật',
      bullets: [
        'Mật khẩu được băm bằng thuật toán Argon2; chúng tôi không lưu mật khẩu dạng văn bản thuần.',
        'Toàn bộ kết nối giữa ứng dụng và máy chủ dùng HTTPS.',
        'Phiên đăng nhập dùng token có thời hạn; trên thiết bị di động token được lưu trong vùng lưu trữ an toàn của hệ điều hành.',
        'Quyền truy cập dữ liệu nội bộ được giới hạn theo vai trò và các thao tác quản trị đều được ghi nhật ký.',
      ],
      paragraphs: [
        'Không có hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng tới dữ liệu của bạn, chúng tôi sẽ thông báo theo quy định pháp luật hiện hành.',
      ],
    },
    {
      heading: '7. Thời gian lưu trữ',
      paragraphs: [
        'Chúng tôi lưu dữ liệu tài khoản trong thời gian bạn còn sử dụng Dịch vụ. Khi bạn yêu cầu xoá tài khoản, dữ liệu cá nhân sẽ được xoá hoặc ẩn danh hoá, trừ phần bắt buộc phải giữ theo quy định pháp luật (ví dụ chứng từ giao dịch) hoặc cần thiết để giải quyết tranh chấp và chống gian lận.',
      ],
    },
    {
      heading: '8. Quyền của bạn và cách xoá tài khoản',
      bullets: [
        'Xem và chỉnh sửa thông tin hồ sơ ngay trong ứng dụng.',
        'Yêu cầu bản sao dữ liệu cá nhân mà chúng tôi đang lưu.',
        'Yêu cầu chỉnh sửa dữ liệu không chính xác.',
        'Rút lại sự đồng ý và yêu cầu ngừng xử lý dữ liệu.',
      ],
      paragraphs: [
        `Để yêu cầu XOÁ TÀI KHOẢN và dữ liệu liên quan, gửi email tới ${LEGAL_CONTACT_EMAIL} từ chính địa chỉ email đã đăng ký, tiêu đề "Yêu cầu xoá tài khoản". Chúng tôi xử lý trong vòng 30 ngày và gửi xác nhận khi hoàn tất. Lưu ý: điểm thưởng, quà chưa sử dụng và lịch sử bình chọn sẽ bị mất và không thể khôi phục.`,
      ],
    },
    {
      heading: '9. Trẻ em',
      paragraphs: [
        'Dịch vụ không dành cho người dưới 13 tuổi. Chúng tôi không cố ý thu thập dữ liệu của trẻ em dưới 13 tuổi. Nếu phát hiện đã thu thập nhầm, chúng tôi sẽ xoá ngay. Phụ huynh phát hiện con em mình đã cung cấp dữ liệu, vui lòng liên hệ chúng tôi.',
      ],
    },
    {
      heading: '10. Chuyển dữ liệu ra nước ngoài',
      paragraphs: [
        'Một số nhà cung cấp dịch vụ của chúng tôi đặt máy chủ ngoài lãnh thổ Việt Nam. Khi chuyển dữ liệu tới các đơn vị này, chúng tôi yêu cầu họ áp dụng biện pháp bảo vệ phù hợp với chính sách này.',
      ],
    },
    {
      heading: '11. Thay đổi chính sách',
      paragraphs: [
        'Chúng tôi có thể cập nhật chính sách này khi tính năng thay đổi. Bản mới sẽ được đăng tại chính trang này kèm ngày hiệu lực mới. Với thay đổi quan trọng, chúng tôi sẽ thông báo trong ứng dụng trước khi áp dụng.',
      ],
    },
    {
      heading: '12. Liên hệ',
      paragraphs: [
        `Mọi câu hỏi hoặc yêu cầu liên quan tới dữ liệu cá nhân, vui lòng liên hệ: ${LEGAL_CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const POLICY_EN: PolicyDoc = {
  title: 'Privacy Policy',
  effectiveLabel: 'Effective date',
  intro: [
    `This policy explains how ${LEGAL_OPERATOR} collects, uses, shares and protects your personal data when you use the FandomVote mobile app and website (the "Service").`,
    'By creating an account and using the Service, you agree to the practices described here.',
  ],
  sections: [
    {
      heading: '1. Data we collect',
      paragraphs: ['We collect only what the Service needs to operate:'],
      bullets: [
        'Account information: email address, password (stored hashed — we never see your plain password), username, display name, the fandom you declare, and a profile picture if you upload one.',
        'Google Sign-In: if you sign in with Google, we receive your email address, display name and profile picture from your Google account. We never receive or store your Google password.',
        'In-service activity: voting history, daily check-ins, point balances and transaction history (Green/Gold/Diamond), idols you follow or nominate, redeemed gifts, and notifications.',
        'Physical gift orders: when you redeem a gift that requires delivery, we collect the recipient name, phone number and shipping address in order to deliver it.',
        'Top-up transactions: the transaction identifier provided by the App Store or Google Play to confirm your purchase. We do NOT collect or store your card or payment details.',
        'Technical data: IP address, device and browser type, and access timestamps — recorded in server logs for security, fraud prevention and troubleshooting.',
        'Images you upload: profile pictures and idol nomination images are stored on Cloudflare R2.',
      ],
    },
    {
      heading: '2. Advertising and advertising identifiers',
      paragraphs: [
        'The Service shows rewarded video ads through Google AdMob. To deliver, frequency-cap and measure ads, AdMob may collect your device advertising identifier and related technical data under Google’s own policies.',
        'When you finish watching an ad, our system receives a confirmation of that view so it can credit reward points to your account. We receive no other personal content from the ad.',
        'You can limit personalised advertising in your device settings (Android: Settings → Google → Ads; iOS: Settings → Privacy → Tracking).',
      ],
    },
    {
      heading: '3. Partner offers (offerwall)',
      paragraphs: [
        'The Service may show a list of tasks provided by partners. To show offers available in your region, we send the partner an anonymous user identifier, your IP address and browser/device information.',
        'When you complete a task, the partner notifies our server so we can credit your points. The partner’s handling of that data is governed by its own privacy policy.',
      ],
    },
    {
      heading: '4. How we use your data',
      bullets: [
        'Create and manage your account and authenticate sign-in.',
        'Operate core features: voting, leaderboards, point wallet, gift redemption, notifications.',
        'Deliver physical gifts to the correct recipient.',
        'Accurately credit rewards from check-ins, ads, partner offers and referrals.',
        'Detect and prevent fraud, abuse and fake accounts.',
        'Provide user support and handle complaints.',
        'Comply with legal obligations and lawful requests from competent authorities.',
      ],
    },
    {
      heading: '5. Data sharing',
      paragraphs: ['We do NOT sell your personal data. We share it only in these cases:'],
      bullets: [
        'Google (Google Sign-In, AdMob): authentication and ad delivery.',
        'Apple App Store / Google Play: processing and verifying in-app purchases.',
        'Offerwall partners: as described in Section 3.',
        'Infrastructure providers: server, database and image storage (Cloudflare R2) used to run the Service.',
        'Delivery providers: your name, phone number and address, only when you redeem a gift requiring shipping.',
        'Government authorities where legally required.',
      ],
    },
    {
      heading: '6. Security',
      bullets: [
        'Passwords are hashed with Argon2; we never store plaintext passwords.',
        'All traffic between the app and our servers uses HTTPS.',
        'Sessions use time-limited tokens; on mobile, tokens are kept in the operating system’s secure storage.',
        'Internal data access is restricted by role and administrative actions are logged.',
      ],
      paragraphs: [
        'No system is perfectly secure. If an incident affects your data, we will notify you as required by applicable law.',
      ],
    },
    {
      heading: '7. Data retention',
      paragraphs: [
        'We keep your account data for as long as you use the Service. When you request deletion, your personal data is deleted or anonymised, except where retention is required by law (for example transaction records) or necessary to resolve disputes and prevent fraud.',
      ],
    },
    {
      heading: '8. Your rights and how to delete your account',
      bullets: [
        'View and edit your profile information directly in the app.',
        'Request a copy of the personal data we hold about you.',
        'Request correction of inaccurate data.',
        'Withdraw consent and request that we stop processing your data.',
      ],
      paragraphs: [
        `To request ACCOUNT DELETION and removal of associated data, email ${LEGAL_CONTACT_EMAIL} from your registered email address with the subject "Account deletion request". We process requests within 30 days and confirm once complete. Note: reward points, unused gifts and voting history will be lost and cannot be restored.`,
      ],
    },
    {
      heading: '9. Children',
      paragraphs: [
        'The Service is not intended for anyone under 13. We do not knowingly collect data from children under 13. If we discover we have, we delete it promptly. Parents who believe their child has provided us data should contact us.',
      ],
    },
    {
      heading: '10. International data transfers',
      paragraphs: [
        'Some of our service providers operate servers outside Vietnam. When we transfer data to them, we require safeguards consistent with this policy.',
      ],
    },
    {
      heading: '11. Changes to this policy',
      paragraphs: [
        'We may update this policy as features change. The current version is always published on this page with a new effective date. For material changes we will notify you in the app before they take effect.',
      ],
    },
    {
      heading: '12. Contact',
      paragraphs: [`For any question or request about your personal data, contact us at ${LEGAL_CONTACT_EMAIL}`],
    },
  ],
};
