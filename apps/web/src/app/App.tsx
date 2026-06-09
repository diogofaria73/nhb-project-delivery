import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminLayout } from './layout/admin-layout';
import { RoleGuard } from './layout/role-guard';
import { LoginPage } from '@/features/auth';
import { UsersPage } from '@/features/users';
import { CompaniesPage } from '@/features/companies';
import { StatusReportsPage, SubmissionsPage } from '@/features/status-reports';
import { GoalsPage, GoalDetailPage } from '@/features/goals';
import { AccountPage } from '@/features/account';
import { FirstLoginPage } from '@/features/first-login';

function HomeRedirect() {
  return <Navigate to="/status-reports" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/first-login" element={<FirstLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/users" element={<RoleGuard allowedRoles={['ADMINISTRATOR']}><UsersPage /></RoleGuard>} />
          <Route path="/companies" element={<RoleGuard allowedRoles={['ADMINISTRATOR']}><CompaniesPage /></RoleGuard>} />
          <Route path="/status-reports/analytics" element={<Navigate to="/status-reports" replace />} />
          <Route path="/status-reports" element={<StatusReportsPage />} />
          <Route path="/status-reports/submissions" element={<SubmissionsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:id" element={<GoalDetailPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}
