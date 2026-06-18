import { NeuButton, NeuCard } from '@/components/neu';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import { useReferralStats } from './use-referral';

export function ReferralCard() {
  const { data } = useReferralStats();
  const toast = useToast();
  if (!data) return null;

  return (
    <NeuCard>
      <strong>Mã mời của bạn</strong>
      <div className="row" style={{ marginTop: 8 }}>
        <code className="mono" style={{ fontSize: 12, wordBreak: 'break-all', flex: 1 }}>
          {data.referralCode}
        </code>
        <NeuButton
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(data.referralCode).then(
              () => toast.success('Đã copy mã mời'),
              () => toast.error(new Error('Không copy được')),
            );
          }}
        >
          Copy
        </NeuButton>
      </div>
      <div className="row" style={{ marginTop: 12, gap: 16 }}>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>
            Đã mời
          </div>
          <strong className="mono">{formatNumber(data.totalInvited)}</strong>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>
            Đã thưởng
          </div>
          <strong className="mono">{formatNumber(data.totalRewarded)}</strong>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
        Bạn & người được mời nhận 500 Green sau khi người đó xác thực email/SĐT.
      </p>
    </NeuCard>
  );
}
