import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logout } from '../login/actions';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck,
  Video,
  LogOut,
  User,
  Settings,
  MessageSquare,
  FolderOpen,
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const localSession = cookieStore.get('vesa_session_user')?.value;
  let user = null;

  if (localSession) {
    try {
      const parsed = JSON.parse(localSession);
      user = {
        id: parsed.id,
        email: parsed.email,
        user_metadata: {
          role: parsed.role,
          clientId: parsed.clientId,
          name: parsed.name,
        },
      } as any;
    } catch {}
  }

  // Fallback to Supabase API call only if no database session cookie is set
  if (!user) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (err) {
      console.warn('Supabase Auth error in AdminLayout:', err);
    }
  }

  if (!user) {
    redirect('/login');
  }

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';

  const menuItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Clients', href: '/admin/clients', icon: Users },
    { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { label: 'Deliverables', href: '/admin/deliverables', icon: FileCheck },
    { label: 'Files', href: '/admin/files', icon: FolderOpen },
    { label: 'Meetings', href: '/admin/meetings', icon: Video },
    { label: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-900">
            <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-wider text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VESA OS
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition-all duration-200 text-sm font-medium"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Footer Section */}
        <div className="p-4 border-t border-slate-900 flex flex-col gap-2.5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold uppercase text-slate-300">
              {name.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-200 truncate">{name}</span>
              <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle Placeholder */}
            <span className="text-sm font-semibold text-slate-200">Workspace Overview</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">Vesa Studios Production Environment</span>
            <div className="h-4 w-px bg-slate-900 hidden sm:block" />
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Children Container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
