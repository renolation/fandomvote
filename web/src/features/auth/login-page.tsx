import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useAuth } from './auth-context';
import { GoogleSignInButton } from './google-signin-button';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = identifier.includes('@') ? { email: identifier } : { phone: identifier };
      await login({ ...body, password });
      navigate('/');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 16 }}>
      <h1 style={{ textAlign: 'center' }}>FandomVote</h1>
      <NeuCard>
        <form onSubmit={onSubmit}>
          <NeuField label="Email hoặc SĐT">
            <NeuInput value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </NeuField>
          <NeuField label="Mật khẩu">
            <NeuInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </NeuField>
          <NeuButton type="submit" variant="blue" loading={busy} style={{ width: '100%' }}>
            Đăng nhập
          </NeuButton>
        </form>
        <GoogleSignInButton />
        <div className="muted" style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </div>
      </NeuCard>
    </div>
  );
}
