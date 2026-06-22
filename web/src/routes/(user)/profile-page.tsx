import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard } from '@/components/neu';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useAuth } from '@/features/auth/auth-context';
import { VerifyPanel } from '@/features/auth/verify-panel';
import { BalanceCards } from '@/features/wallet/balance-cards';
import { ConvertDiamondDialog } from '@/features/wallet/convert-diamond-dialog';
import { GiftWallet } from '@/features/shop/gift-wallet';
import { ReferralCard } from '@/features/referral/referral-card';
import { VoteActivityList } from '@/features/vote/vote-activity-list';
import { MyRankCard } from '@/features/leaderboard/my-rank-card';
import { MyNominationsCard } from '@/features/idol/my-nominations-card';
import { PlatformInfoCard } from '@/features/profile/platform-info-card';

const head: React.CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 700 };

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [convertOpen, setConvertOpen] = useState(false);

  return (
    <div className="split-360">
      {/* Cột trái — sticky trên desktop */}
      <div className="col" style={{ gap: 18, position: 'sticky', top: 98 }}>
        <NeuCard style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto', ...stripeStyle(colorForId(user?.id ?? 'x'), 84) }} />
          <div style={{ ...head, fontSize: 21, marginTop: 12 }}>{user?.displayName}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Fandom: <strong>{user?.fandom ?? 'Fan'}</strong>
          </div>
          <NeuButton
            variant="pink"
            style={{ width: '100%', marginTop: 14 }}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Đăng xuất
          </NeuButton>
        </NeuCard>

        <NeuCard>
          <div className="spread" style={{ marginBottom: 13 }}>
            <span style={{ ...head, fontSize: 16 }}>💼 Ví tiền tệ</span>
            <NeuButton size="sm" variant="ghost" onClick={() => setConvertOpen(true)}>
              Đổi Diamond
            </NeuButton>
          </div>
          <BalanceCards />
        </NeuCard>

        <ReferralCard />

        <NeuCard>
          <div style={{ ...head, fontSize: 16, marginBottom: 12 }}>📊 Hoạt động vote</div>
          <VoteActivityList />
        </NeuCard>

        <VerifyPanel />
      </div>

      {/* Cột phải — tất cả hiển thị cùng lúc (không tab) */}
      <div className="col" style={{ gap: 28 }}>
        <div>
          <div style={{ ...head, fontSize: 22, marginBottom: 14 }}>🎁 Ví Quà Tặng</div>
          <GiftWallet />
        </div>
        <MyNominationsCard />
        <MyRankCard />
        <PlatformInfoCard />
      </div>

      <ConvertDiamondDialog open={convertOpen} onClose={() => setConvertOpen(false)} />
    </div>
  );
}
