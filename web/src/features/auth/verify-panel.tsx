import { useState } from 'react';
import { NeuButton, NeuCard, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import type { VerificationChannel } from '@/types/api';
import { authApi } from './auth-api';
import { useAuth } from './auth-context';

export function VerifyPanel() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [channel, setChannel] = useState<VerificationChannel>('EMAIL');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const verified = channel === 'EMAIL' ? !!user?.emailVerifiedAt : !!user?.phoneVerifiedAt;

  const request = async () => {
    setBusy(true);
    try {
      await authApi.requestVerify(channel);
      setSent(true);
      toast.success('Đã gửi OTP. Kiểm tra email/SMS (dev: xem log backend).');
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await authApi.confirmVerify(channel, otp);
      await refreshUser();
      setSent(false);
      setOtp('');
      toast.success('Xác thực thành công! Thưởng mời (nếu có) đã được kích hoạt.');
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <NeuCard>
      <strong>Xác thực tài khoản</strong>
      <div className="row" style={{ margin: '8px 0' }}>
        {(['EMAIL', 'PHONE'] as VerificationChannel[]).map((c) => (
          <NeuButton
            key={c}
            size="sm"
            variant={channel === c ? 'blue' : 'ghost'}
            onClick={() => {
              setChannel(c);
              setSent(false);
            }}
          >
            {c === 'EMAIL' ? 'Email' : 'SĐT'}
          </NeuButton>
        ))}
      </div>
      {verified ? (
        <div style={{ color: 'var(--c-green)', fontWeight: 600 }}>✓ Đã xác thực</div>
      ) : !sent ? (
        <NeuButton loading={busy} onClick={request}>
          Gửi OTP
        </NeuButton>
      ) : (
        <>
          <NeuField label="Nhập OTP (6 số)">
            <NeuInput value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" />
          </NeuField>
          <NeuButton variant="green" loading={busy} disabled={otp.length < 6} onClick={confirm}>
            Xác nhận
          </NeuButton>
        </>
      )}
    </NeuCard>
  );
}
