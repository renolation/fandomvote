import { NeuCard } from '@/components/neu';

// Thông tin nền tảng (nội dung tĩnh, không phải dữ liệu user).
export function PlatformInfoCard() {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, marginBottom: 14 }}>ℹ️ Thông tin</div>
      <NeuCard>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333' }}>
          FandomVote (FDV) là nền tảng bình chọn thần tượng kết hợp kinh tế điểm thưởng và trách nhiệm xã hội — nơi mỗi
          lá phiếu của fandom có thể trở thành đóng góp thiện nguyện.
        </div>
        <div style={{ borderTop: '2px solid #efe9dc', marginTop: 13, paddingTop: 13, display: 'flex', flexWrap: 'wrap', gap: '10px 28px', fontSize: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ color: '#888' }}>📧 Email</span>
            <span className="mono" style={{ fontWeight: 700 }}>support@fandomvote.vn</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ color: '#888' }}>📞 Hotline</span>
            <span className="mono" style={{ fontWeight: 700 }}>1900 6868</span>
          </div>
        </div>
      </NeuCard>
    </div>
  );
}
