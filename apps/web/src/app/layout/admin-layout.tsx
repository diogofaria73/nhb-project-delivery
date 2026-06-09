import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Sidebar } from './sidebar';

const STORAGE_KEY = 'sidebar:collapsed';

export function AdminLayout() {
  const storedUser = localStorage.getItem('user');
  const { mustChangePassword } = useCurrentUser();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }
  if (mustChangePassword) {
    return <Navigate to="/first-login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main
        className={cn(
          'min-h-screen transition-[padding] duration-200 ease-out',
          collapsed ? 'md:pl-[72px]' : 'md:pl-[260px]',
        )}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 pt-16 sm:px-6 md:pt-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
