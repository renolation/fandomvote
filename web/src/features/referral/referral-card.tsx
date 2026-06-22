import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import { useReferralStats } from './use-referral';

export function ReferralCard() {
  const { data } = useReferralStats();
  const toast = useToast();
  if (!data) return null;

  const copy = () =>
    navigator.clipboard.writeText(data.referralCode).then(
      () => toast.success('Đã copy mã mời'),
      () => toast.error(new Error('Không copy được')),
    );

  return (
    <div style={{ background: '#3B82F6', border: '3px solid var(--c-ink)', borderRadius: 16, boxShadow: '5px 5px 0 var(--c-ink)', padding: 18, color: '#fff' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>🔗 Mã mời của bạn</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <div className="mono" style={{ flex: 1, minWidth: 0, background: '#fff', color: '#000', border: '2px solid var(--c-ink)', borderRadius: 9, padding: '10px 12px', fontWeight: 700, fontSize: 17, letterSpacing: 1, wordBreak: 'break-all' }}>
          {data.referralCode}
        </div>
        <button
          onClick={copy}
          style={{ flex: 'none', background: '#FFD60A', color: '#000', border: '2px solid var(--c-ink)', borderRadius: 9, padding: '0 16px', fontWeight: 700, fontFamily: 'var(--font-head)', cursor: 'pointer', boxShadow: '2px 2px 0 var(--c-ink)' }}
        >
          Copy
        </button>
      </div>
      <div style={{ background: 'rgba(255,255,255,.16)', border: '2px solid var(--c-ink)', borderRadius: 9, padding: '9px 11px', marginTop: 10, fontSize: 11, lineHeight: 1.5 }}>
        🎁 Cả bạn và người được mời nhận <strong>500 Gold</strong> khi bạn ấy tích luỹ đủ 500 Gold đầu tiên (video / nhiệm vụ / offerwall).
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid var(--c-ink)', borderRadius: 9, padding: 9, textAlign: 'center' }}>
          <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{formatNumber(data.totalInvited)}</div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>Đã mời</div>
        </div>
        <div style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid var(--c-ink)', borderRadius: 9, padding: 9, textAlign: 'center' }}>
          <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{formatNumber(data.totalRewarded)}</div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>Đã thưởng</div>
        </div>
      </div>
    </div>
  );
}
