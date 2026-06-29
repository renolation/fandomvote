import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/toast';
import { useAuth } from './auth-context';

// GIS (Google Identity Services). Ẩn nếu chưa cấu hình VITE_GOOGLE_CLIENT_ID.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleGlobal = any;
declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

export function GoogleSignInButton({ referralCode }: { referralCode?: string }) {
  // Runtime config (container inject /config.js) ưu tiên, fallback build-time env (dev).
  const clientId =
    (typeof window !== 'undefined' ? window.__FDV_CONFIG__?.googleClientId : undefined) ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const ref = useRef<HTMLDivElement>(null);
  const { google } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          try {
            await google({ idToken: resp.credential, referralCode });
            navigate('/');
          } catch (e) {
            toast.error(e);
          }
        },
      });
      if (ref.current) {
        window.google?.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large' });
      }
    };
    document.body.appendChild(script);
    return () => script.remove();
    // referralCode cố ý không vào deps — chỉ init GIS 1 lần.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;
  return <div ref={ref} style={{ marginTop: 12 }} />;
}
