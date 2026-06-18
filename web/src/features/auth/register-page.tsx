import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useAuth } from './auth-context';
import { GoogleSignInButton } from './google-signin-button';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error(new Error('Cần email hoặc số điện thoại'));
      return;
    }
    setBusy(true);
    try {
      await register({
        displayName: form.displayName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        referralCode: form.referralCode || undefined,
      });
      toast.success('Đăng ký thành công! Hãy xác thực email/SĐT để nhận thưởng mời.');
      navigate('/profile');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '32px auto', padding: 16 }}>
      <h1 style={{ textAlign: 'center' }}>Đăng ký</h1>
      <NeuCard>
        <form onSubmit={onSubmit}>
          <NeuField label="Tên hiển thị">
            <NeuInput value={form.displayName} onChange={set('displayName')} required />
          </NeuField>
          <NeuField label="Email">
            <NeuInput type="email" value={form.email} onChange={set('email')} />
          </NeuField>
          <NeuField label="Số điện thoại">
            <NeuInput value={form.phone} onChange={set('phone')} />
          </NeuField>
          <NeuField label="Mật khẩu (≥ 8 ký tự)">
            <NeuInput
              type="password"
              value={form.password}
              onChange={set('password')}
              minLength={8}
              required
            />
          </NeuField>
          <NeuField label="Mã mời (tuỳ chọn)">
            <NeuInput value={form.referralCode} onChange={set('referralCode')} placeholder="User ID người giới thiệu" />
          </NeuField>
          <NeuButton type="submit" variant="green" loading={busy} style={{ width: '100%' }}>
            Tạo tài khoản
          </NeuButton>
        </form>
        <GoogleSignInButton referralCode={form.referralCode || undefined} />
        <div className="muted" style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </NeuCard>
    </div>
  );
}
