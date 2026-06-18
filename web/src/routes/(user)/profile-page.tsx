import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard } from '@/components/neu';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useAuth } from '@/features/auth/auth-context';
import { VerifyPanel } from '@/features/auth/verify-panel';
import { BalanceCards } from '@/features/wallet/balance-cards';
import { ConvertDiamondDialog } from '@/features/wallet/convert-diamond-dialog';
import { LedgerList } from '@/features/wallet/ledger-list';
import { GiftWallet } from '@/features/shop/gift-wallet';
import { ReferralCard } from '@/features/referral/referral-card';
import { VoteActivityList } from '@/features/vote/vote-activity-list';

type Tab = 'gifts' | 'referral' | 'activity' | 'ledger';
const TABS: { key: Tab; label: string }[] = [
  { key: 'gifts', label: '🎁 Ví Quà' },
  { key: 'referral', label: '🔗 Mã mời' },
  { key: 'activity', label: '📊 Hoạt động vote' },
  { key: 'ledger', label: '📜 Lịch sử ví' },
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('gifts');
  const [convertOpen, setConvertOpen] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Left sticky column */}
      <div className="col" style={{ gap: 18, position: 'sticky', top: 98 }}>
        <NeuCard style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto', ...stripeStyle(colorForId(user?.id ?? 'x'), 84) }} />
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 21, marginTop: 12 }}>
            {user?.displayName}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {user?.fandom ?? 'Fan'}
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
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>💼 Ví tiền tệ</span>
            <NeuButton size="sm" variant="ghost" onClick={() => setConvertOpen(true)}>
              Đổi Diamond
            </NeuButton>
          </div>
          <BalanceCards />
        </NeuCard>

        <VerifyPanel />
      </div>

      {/* Right column */}
      <div className="col">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <NeuButton key={t.key} size="sm" variant={tab === t.key ? 'blue' : 'ghost'} onClick={() => setTab(t.key)}>
              {t.label}
            </NeuButton>
          ))}
        </div>
        {tab === 'gifts' && <GiftWallet />}
        {tab === 'referral' && <ReferralCard />}
        {tab === 'activity' && <VoteActivityList />}
        {tab === 'ledger' && <LedgerList />}
      </div>

      <ConvertDiamondDialog open={convertOpen} onClose={() => setConvertOpen(false)} />
    </div>
  );
}
