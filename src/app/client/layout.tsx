import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getClientBranding } from './actions';
import { logout } from '../login/actions';
import { getCurrentUser } from '@/lib/auth';
import { Sparkles, LogOut } from 'lucide-react';

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'CLIENT') {
    redirect('/login');
  }

  const branding = await getClientBranding();
  const primaryColor = branding?.primaryColor || '#0f172a';
  const secondaryColor = branding?.secondaryColor || '#3b82f6';
  const logoUrl = branding?.logoUrl;
  const clientName = branding?.name || 'Client Workspace';

  const name = user.name || user.email?.split('@')[0] || 'Client';

  return (
    <div
      style={{
        '--client-primary': primaryColor,
        '--client-secondary': secondaryColor,
      } as React.CSSProperties}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans"
    >
      {/* Client Brand Navbar */}
      <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        
        {/* Left: Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={clientName} className="w-full h-full object-cover" />
            ) : (
              clientName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-slate-200">{clientName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">VESA OS Workspace</span>
            </div>
          </div>
        </div>

        {/* Right: Profile, Badge & Sign Out */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-medium text-slate-200">{name}</span>
              <span className="text-[9px] text-slate-500">{user.email}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-900" />

          <form action={logout}>
            <button
              type="submit"
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>

      </header>

      {/* Main Client Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
