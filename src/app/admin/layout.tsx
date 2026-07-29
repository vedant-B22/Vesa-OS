import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { logout } from '../login/actions';
import { getCurrentUser } from '@/lib/auth';
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <AdminLayoutClient 
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
      }}
      logoutAction={logout}
    >
      {children}
    </AdminLayoutClient>
  );
}
