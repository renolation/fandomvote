// Nội dung Điều khoản sử dụng (VI + EN). Bám đúng cơ chế đang chạy:
// điểm ảo Green/Gold/Diamond, nạp qua App Store/Google Play, bình chọn theo campaign,
// đổi quà (digital/vật lý), kiếm điểm qua quảng cáo và nhiệm vụ đối tác.
import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR, type PolicyDoc } from './legal-common';

export const TERMS_VI: PolicyDoc = {
  title: 'Điều khoản sử dụng',
  effectiveLabel: 'Ngày hiệu lực',
  intro: [
    `Đây là thỏa thuận giữa bạn và ${LEGAL_OPERATOR} về việc sử dụng ứng dụng di động và website FandomVote ("Dịch vụ").`,
    'Bằng việc tạo tài khoản hoặc tiếp tục sử dụng Dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng Dịch vụ.',
  ],
  sections: [
    {
      heading: '1. Tài khoản',
      bullets: [
        'Bạn phải từ 13 tuổi trở lên mới được tạo tài khoản.',
        'Mỗi người chỉ được sở hữu một tài khoản. Tạo nhiều tài khoản để trục lợi phần thưởng là vi phạm.',
        'Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động phát sinh từ tài khoản của mình.',
        'Thông tin bạn cung cấp phải chính xác. Thông tin sai có thể khiến bạn không nhận được quà đã đổi.',
      ],
    },
    {
      heading: '2. Điểm trong Dịch vụ (Green · Gold · Diamond)',
      paragraphs: [
        'Green, Gold và Diamond là điểm ảo dùng trong Dịch vụ. Đây KHÔNG phải tiền tệ, KHÔNG phải tài sản và không có giá trị quy đổi ra tiền mặt.',
      ],
      bullets: [
        'Bạn được cấp quyền sử dụng điểm trong phạm vi Dịch vụ; bạn không sở hữu chúng.',
        'Điểm không được mua bán, tặng, chuyển nhượng giữa các tài khoản hoặc trao đổi ra tiền mặt dưới bất kỳ hình thức nào.',
        'Green có thể có thời hạn sử dụng và sẽ hết hiệu lực khi quá hạn.',
        'Green có giới hạn số lượng nhận mỗi ngày.',
        'Chúng tôi có thể điều chỉnh tỉ lệ quy đổi, mức thưởng và giới hạn nhận điểm. Thay đổi chỉ áp dụng cho các giao dịch phát sinh sau đó.',
        'Khi tài khoản bị xoá hoặc bị khoá do vi phạm, toàn bộ điểm còn lại sẽ mất và không được hoàn.',
      ],
    },
    {
      heading: '3. Nạp Diamond và thanh toán',
      bullets: [
        'Giao dịch nạp được xử lý bởi Apple App Store hoặc Google Play. Chúng tôi không trực tiếp thu tiền và không lưu thông tin thẻ của bạn.',
        'Diamond được cộng sau khi cửa hàng xác nhận giao dịch thành công.',
        'Yêu cầu hoàn tiền tuân theo chính sách của Apple hoặc Google. Diamond đã sử dụng để vote hoặc đổi quà thì không hoàn lại.',
        'Nếu một giao dịch bị hoàn tiền hoặc bị huỷ sau khi đã cộng điểm, chúng tôi có quyền trừ lại số điểm tương ứng; nếu số dư âm, tài khoản có thể bị tạm khoá cho tới khi xử lý xong.',
      ],
    },
    {
      heading: '4. Bình chọn',
      bullets: [
        'Mỗi chiến dịch có thời gian mở, thời gian đóng và thể lệ riêng được công bố trong Dịch vụ.',
        'Điểm đã dùng để bình chọn sẽ bị trừ ngay và không được hoàn, trừ trường hợp chiến dịch bị huỷ.',
        'Nếu một chiến dịch bị huỷ, chúng tôi sẽ hoàn lại điểm đã dùng để bình chọn cho chiến dịch đó.',
        'Kết quả được chốt tại thời điểm đóng chiến dịch và được lưu lại. Chúng tôi có quyền loại bỏ các lượt bình chọn gian lận trước khi công bố kết quả.',
        'Chiến dịch có thể được dời lịch hoặc huỷ vì lý do vận hành; chúng tôi sẽ thông báo trong Dịch vụ.',
      ],
    },
    {
      heading: '5. Kiếm điểm qua quảng cáo và nhiệm vụ',
      bullets: [
        'Điểm thưởng từ xem quảng cáo hoặc hoàn thành nhiệm vụ chỉ được cộng sau khi hệ thống xác nhận lượt xem hoặc nhiệm vụ hợp lệ.',
        'Số lượt được thưởng mỗi ngày có giới hạn.',
        'Nhiệm vụ do đối tác cung cấp; việc xác nhận hoàn thành phụ thuộc vào đối tác. Chúng tôi không chịu trách nhiệm về nội dung hoặc dịch vụ của bên thứ ba.',
        'Nếu đối tác báo huỷ kết quả (ví dụ do gian lận hoặc hoàn tiền), chúng tôi sẽ trừ lại số điểm đã cộng.',
      ],
    },
    {
      heading: '6. Đổi quà',
      bullets: [
        'Số lượng quà có hạn; hết kho thì ngừng đổi.',
        'Quà điện tử được giao trong Dịch vụ và có thể có hạn sử dụng.',
        'Quà vật lý chỉ giao trong phạm vi lãnh thổ được hỗ trợ. Bạn có trách nhiệm cung cấp địa chỉ và số điện thoại chính xác; chúng tôi không chịu trách nhiệm nếu giao thất bại do thông tin sai.',
        'Điểm đã dùng để đổi quà không được hoàn, trừ khi chúng tôi không thể giao quà.',
      ],
    },
    {
      heading: '7. Hành vi bị cấm',
      paragraphs: ['Bạn không được:'],
      bullets: [
        'Dùng bot, script, trình giả lập hoặc công cụ tự động để bình chọn, xem quảng cáo hoặc làm nhiệm vụ.',
        'Tạo nhiều tài khoản, dùng tài khoản ảo hoặc tự giới thiệu chính mình để nhận thưởng.',
        'Can thiệp, dịch ngược, khai thác lỗi của Dịch vụ hoặc gọi API theo cách bất thường nhằm trục lợi.',
        'Mua bán, trao đổi tài khoản hoặc điểm với người khác.',
        'Đăng nội dung vi phạm pháp luật, xúc phạm, bôi nhọ, hoặc xâm phạm quyền của người khác.',
        'Đề cử idol bằng hình ảnh hoặc thông tin mà bạn không có quyền sử dụng.',
      ],
    },
    {
      heading: '8. Nội dung bạn đăng tải',
      paragraphs: [
        'Bạn giữ quyền đối với nội dung mình đăng (ảnh đại diện, ảnh và thông tin đề cử idol). Khi đăng, bạn cấp cho chúng tôi quyền không độc quyền, miễn phí bản quyền để lưu trữ và hiển thị nội dung đó trong phạm vi vận hành Dịch vụ.',
        'Bạn cam kết có đầy đủ quyền đối với nội dung đã đăng. Chúng tôi có thể gỡ nội dung vi phạm mà không cần báo trước.',
      ],
    },
    {
      heading: '9. Tạm khoá và chấm dứt',
      paragraphs: [
        'Chúng tôi có thể tạm khoá hoặc chấm dứt tài khoản, thu hồi điểm và huỷ phần thưởng nếu phát hiện vi phạm các điều khoản này, đặc biệt là hành vi gian lận.',
        `Bạn có thể ngừng sử dụng Dịch vụ bất kỳ lúc nào và yêu cầu xoá tài khoản bằng email tới ${LEGAL_CONTACT_EMAIL}. Khi tài khoản bị xoá, điểm và quà chưa dùng sẽ mất, không thể khôi phục.`,
      ],
    },
    {
      heading: '10. Miễn trừ và giới hạn trách nhiệm',
      paragraphs: [
        'Dịch vụ được cung cấp "nguyên trạng". Chúng tôi cố gắng duy trì hoạt động ổn định nhưng không cam kết Dịch vụ không bao giờ gián đoạn hoặc không có lỗi.',
        'Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm với thiệt hại gián tiếp phát sinh từ việc sử dụng Dịch vụ. Điều khoản này không loại trừ các trách nhiệm mà pháp luật không cho phép loại trừ.',
      ],
    },
    {
      heading: '11. Thay đổi điều khoản',
      paragraphs: [
        'Chúng tôi có thể cập nhật điều khoản khi tính năng thay đổi. Bản mới được đăng tại trang này kèm ngày hiệu lực mới. Với thay đổi quan trọng, chúng tôi sẽ thông báo trong Dịch vụ trước khi áp dụng. Tiếp tục sử dụng sau ngày hiệu lực đồng nghĩa với việc bạn chấp nhận bản mới.',
      ],
    },
    {
      heading: '12. Luật áp dụng và liên hệ',
      paragraphs: [
        'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp sẽ được ưu tiên giải quyết bằng thương lượng trước khi đưa ra cơ quan có thẩm quyền.',
        `Liên hệ: ${LEGAL_CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const TERMS_EN: PolicyDoc = {
  title: 'Terms of Service',
  effectiveLabel: 'Effective date',
  intro: [
    `This is an agreement between you and ${LEGAL_OPERATOR} regarding your use of the FandomVote mobile app and website (the "Service").`,
    'By creating an account or continuing to use the Service, you confirm that you have read, understood and agree to these terms. If you do not agree, please stop using the Service.',
  ],
  sections: [
    {
      heading: '1. Accounts',
      bullets: [
        'You must be at least 13 years old to create an account.',
        'One person may hold only one account. Creating multiple accounts to farm rewards is a violation.',
        'You are responsible for keeping your password secure and for all activity under your account.',
        'The information you provide must be accurate. Incorrect information may prevent delivery of gifts you redeem.',
      ],
    },
    {
      heading: '2. In-service points (Green · Gold · Diamond)',
      paragraphs: [
        'Green, Gold and Diamond are virtual points used inside the Service. They are NOT currency, NOT property, and have no cash value.',
      ],
      bullets: [
        'You receive a limited right to use points within the Service; you do not own them.',
        'Points may not be sold, gifted, transferred between accounts, or exchanged for cash in any form.',
        'Green may carry an expiry date and becomes unusable once expired.',
        'There is a daily cap on how much Green you can earn.',
        'We may adjust conversion rates, reward amounts and earning limits. Changes apply only to transactions made after the change.',
        'If your account is deleted or banned for violations, any remaining points are forfeited and not refunded.',
      ],
    },
    {
      heading: '3. Diamond top-ups and payments',
      bullets: [
        'Purchases are processed by the Apple App Store or Google Play. We do not collect payments directly and do not store your card details.',
        'Diamonds are credited after the store confirms a successful transaction.',
        'Refund requests follow Apple’s or Google’s policies. Diamonds already spent on votes or redemptions are non-refundable.',
        'If a transaction is refunded or reversed after points were credited, we may deduct the corresponding points; if the balance goes negative, the account may be suspended until resolved.',
      ],
    },
    {
      heading: '4. Voting',
      bullets: [
        'Each campaign has its own opening time, closing time and rules, published within the Service.',
        'Points spent on votes are deducted immediately and are non-refundable, except where a campaign is cancelled.',
        'If a campaign is cancelled, we refund the points spent voting in that campaign.',
        'Results are finalised at closing time and recorded. We may remove fraudulent votes before publishing results.',
        'Campaigns may be rescheduled or cancelled for operational reasons; we will announce this in the Service.',
      ],
    },
    {
      heading: '5. Earning points from ads and offers',
      bullets: [
        'Rewards for watching ads or completing offers are credited only after our system confirms a valid view or completion.',
        'The number of rewarded views per day is limited.',
        'Offers are supplied by partners and completion is confirmed by them. We are not responsible for third-party content or services.',
        'If a partner reverses a completion (for example due to fraud or a refund), we will deduct the points that were credited.',
      ],
    },
    {
      heading: '6. Gift redemption',
      bullets: [
        'Gift stock is limited; redemption stops when stock runs out.',
        'Digital gifts are delivered inside the Service and may have an expiry date.',
        'Physical gifts ship only to supported territories. You are responsible for providing an accurate address and phone number; we are not liable for failed delivery caused by incorrect details.',
        'Points spent on a redemption are non-refundable unless we are unable to deliver the gift.',
      ],
    },
    {
      heading: '7. Prohibited conduct',
      paragraphs: ['You must not:'],
      bullets: [
        'Use bots, scripts, emulators or any automation to vote, watch ads or complete offers.',
        'Create multiple or fake accounts, or refer yourself, to obtain rewards.',
        'Tamper with, reverse-engineer or exploit the Service, or call our APIs in abnormal ways for gain.',
        'Sell, trade or transfer accounts or points.',
        'Post unlawful, abusive, defamatory content, or content that infringes others’ rights.',
        'Nominate an idol using images or information you do not have the right to use.',
      ],
    },
    {
      heading: '8. Content you upload',
      paragraphs: [
        'You keep your rights in the content you upload (profile pictures, idol nomination images and details). By uploading, you grant us a non-exclusive, royalty-free right to store and display that content for the purpose of operating the Service.',
        'You confirm you hold the necessary rights to the content you upload. We may remove infringing content without prior notice.',
      ],
    },
    {
      heading: '9. Suspension and termination',
      paragraphs: [
        'We may suspend or terminate accounts, reclaim points and cancel rewards if we find a breach of these terms, particularly fraud.',
        `You may stop using the Service at any time and request account deletion by emailing ${LEGAL_CONTACT_EMAIL}. On deletion, unused points and gifts are forfeited and cannot be restored.`,
      ],
    },
    {
      heading: '10. Disclaimer and limitation of liability',
      paragraphs: [
        'The Service is provided "as is". We work to keep it running reliably but do not warrant that it will be uninterrupted or error-free.',
        'To the extent permitted by law, we are not liable for indirect damages arising from your use of the Service. Nothing here excludes liability that cannot lawfully be excluded.',
      ],
    },
    {
      heading: '11. Changes to these terms',
      paragraphs: [
        'We may update these terms as features change. The current version is published on this page with a new effective date. For material changes we will notify you in the Service beforehand. Continuing to use the Service after the effective date means you accept the new version.',
      ],
    },
    {
      heading: '12. Governing law and contact',
      paragraphs: [
        'These terms are governed by the laws of Vietnam. Disputes will first be addressed through negotiation before being brought to a competent authority.',
        `Contact: ${LEGAL_CONTACT_EMAIL}`,
      ],
    },
  ],
};
