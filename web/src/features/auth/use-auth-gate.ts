import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/toast';
import { useAuth } from './auth-context';

// Cho xem tự do, chỉ chặn ACTION. Chưa auth → nhắc + chuyển sang login.
export function useAuthGate() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  return useCallback(
    (action: () => void) => {
      if (!isAuthed) {
        toast.show('Đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }
      action();
    },
    [isAuthed, navigate, toast],
  );
}
