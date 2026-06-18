import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/admin-layout';
import { AppLayout } from '@/components/app-layout';
import { RequireAdmin, RequireAuth } from '@/components/route-guards';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { VotePage } from '@/routes/(user)/vote-page';
import { CampaignDetailPage } from '@/routes/(user)/campaign-detail-page';
import { ShopPage } from '@/routes/(user)/shop-page';
import { ProfilePage } from '@/routes/(user)/profile-page';
import { NotificationsPage } from '@/routes/(user)/notifications-page';
import { AdminDashboardPage } from '@/routes/(admin)/dashboard-page';
import { AdminIdolsPage } from '@/routes/(admin)/idols-page';
import { AdminCampaignCreatePage } from '@/routes/(admin)/campaign-create-page';

export function App() {
  const qc = useQueryClient();
  // api-client phát 'fdv:logout' khi refresh fail / theft → xoá cache.
  useEffect(() => {
    const handler = () => qc.clear();
    window.addEventListener('fdv:logout', handler);
    return () => window.removeEventListener('fdv:logout', handler);
  }, [qc]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User shell — xem tự do (chưa auth vẫn vào được home/campaign/shop) */}
      <Route element={<AppLayout />}>
        <Route index element={<VotePage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="shop" element={<ShopPage />} />
        {/* Cần auth: hồ sơ cá nhân + thông báo */}
        <Route element={<RequireAuth />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Admin — cần auth + role ADMIN */}
      <Route element={<RequireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="idols" element={<AdminIdolsPage />} />
          <Route path="campaigns/new" element={<AdminCampaignCreatePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
