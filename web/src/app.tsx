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
import { AdminReviewPage } from '@/routes/(admin)/review-page';
import { AdminCampaignsPage } from '@/routes/(admin)/campaigns-page';
import { AdminCampaignCreatePage } from '@/routes/(admin)/campaign-create-page';
import { AdminShopPage } from '@/routes/(admin)/shop-page';
import { AdminEventsPage } from '@/routes/(admin)/events-page';
import { AdminLeaderboardPage } from '@/routes/(admin)/leaderboard-page';
import { AdminAnalyticsPage } from '@/routes/(admin)/analytics-page';
import { AdminStubPage } from '@/routes/(admin)/stub-page';

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
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="review" element={<AdminReviewPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="campaigns/new" element={<AdminCampaignCreatePage />} />
          <Route path="leaderboards" element={<AdminLeaderboardPage />} />
          <Route path="shop" element={<AdminShopPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="orders" element={<AdminStubPage title="Đơn hàng (Physical)" />} />
          <Route path="reconcile" element={<AdminStubPage title="Đối soát" />} />
          <Route path="users" element={<AdminStubPage title="Người dùng" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
