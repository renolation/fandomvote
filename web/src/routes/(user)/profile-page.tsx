import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard } from '@/components/neu';
import { useAuth } from '@/features/auth/auth-context';
import { VerifyPanel } from '@/features/auth/verify-panel';
import { BalanceCards } from '@/features/wallet/balance-cards';
import { ConvertDiamondDialog } from '@/features/wallet/convert-diamond-dialog';
import { LedgerList } from '@/features/wallet/ledger-list';
import { GiftWallet } from '@/features/shop/gift-wallet';
import { ReferralCard } from '@/features/referral/referral-card';
import { VoteActivityList } from '@/features/vote/vote-activity-list';

type Tab = 'wallet' | 'gifts' | 'referral' | 'activity' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'wallet', label: 'Ví' },
  { key: 'gifts', label: 'Ví Quà' },
  { key: 'referral', label: 'Mã mời' },
  { key: 'activity', label: 'Vote' },
  { key: 'settings', label: 'Cài đặt' },
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('wallet');
  const [convertOpen, setConvertOpen] = useState(false);

  return (
    <div className="col">
      <div className="spread">
        <div>
          <h2 style={{ margin: 0 }}>{user?.displayName}</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {user?.fandom ?? 'Fan'}
          </span>
        </div>
      </div>

      <div className="row" style={{ flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <NeuButton
            key={t.key}
            size="sm"
            variant={tab === t.key ? 'blue' : 'ghost'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </NeuButton>
        ))}
      </div>

      {tab === 'wallet' && (
        <div className="col">
          <BalanceCards />
          <NeuButton variant="ghost" onClick={() => setConvertOpen(true)}>
            Đổi Diamond → Gold
          </NeuButton>
          <h3 style={{ margin: '8px 0 0' }}>Lịch sử ví</h3>
          <LedgerList />
          <ConvertDiamondDialog open={convertOpen} onClose={() => setConvertOpen(false)} />
        </div>
      )}
      {tab === 'gifts' && <GiftWallet />}
      {tab === 'referral' && <ReferralCard />}
      {tab === 'activity' && <VoteActivityList />}
      {tab === 'settings' && (
        <div className="col">
          <VerifyPanel />
          <NeuCard flat>
            <strong>Thông tin liên hệ</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Liên hệ admin để được hỗ trợ.
            </div>
          </NeuCard>
          <NeuButton
            variant="pink"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Đăng xuất
          </NeuButton>
        </div>
      )}
    </div>
  );
}
