import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminLayout } from './layout/admin-layout';
import { RoleGuard } from './layout/role-guard';
import { LoginPage } from '@/features/auth';
import { UsersPage } from '@/features/users';
import { AccountPage } from '@/features/account';
import { FirstLoginPage } from '@/features/first-login';
import { DashboardPage, ImportHistoryPage } from '@/features/project-tracking';

function HomeRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/first-login" element={<FirstLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/dashboard/imports"
            element={
              <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                <ImportHistoryPage />
              </RoleGuard>
            }
          />
          <Route
            path="/users"
            element={
              <RoleGuard allowedRoles={['ADMINISTRATOR']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route path="/account" element={<AccountPage />} />
          {/* Legacy routes — redirect to the new Dashboard so open tabs don't 404. */}
          <Route path="/companies" element={<Navigate to="/dashboard" replace />} />
          <Route path="/status-reports/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/goals/*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}
