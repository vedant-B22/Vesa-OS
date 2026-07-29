'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '../shared/CommandPalette';
import { 
  Sparkles,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck,
  Video,
  LogOut,
  Settings,
  MessageSquare,
  FolderOpen,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Clock,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

interface MenuLink {
  label: string;
  href: string;
  icon: any;
}

interface AdminLayoutClientProps {
  children: ReactNode;
  user: {
    id: string;
    email: string | null;
    name: string;
  };
  logoutAction: any;
}

export function AdminLayoutClient({ children, user, logoutAction }: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuLink[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Clients', href: '/admin/clients', icon: Users },
    { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { label: 'Deliverables', href: '/admin/deliverables', icon: FileCheck },
    { label: 'Files', href: '/admin/files', icon: FolderOpen },
    { label: 'Meetings', href: '/admin/meetings', icon: Video },
    { label: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
    { label: 'Billing & Invoices', href: '/admin/billing', icon: CreditCard },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Team Members', href: '/admin/team', icon: ShieldAlert },
    { label: 'Activity Logs', href: '/admin/activity', icon: Clock },
  ];

  const name = user.name || user.email?.split('@')[0] || 'Admin';

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
    }`;
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside 
        className={`border-r border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between hidden md:flex transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Logo & Toggle */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="VESA OS" className="h-7 w-auto object-contain" />
                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  Admin
                </span>
              </div>
            )}
            {isCollapsed && (
              <div className="mx-auto">
                <img src="/favicon.ico" alt="V" className="h-6 w-6 object-contain" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3.5 top-4.5 p-1 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors z-20 shadow-md"
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-900 flex flex-col gap-2.5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold uppercase text-slate-300 shrink-0">
              {name.slice(0, 2)}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">{name}</span>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>
            )}
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className={`w-full flex items-center gap-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        >
          <aside 
            onClick={(e) => e.stopPropagation()}
            className="w-64 h-full border-r border-slate-900 bg-slate-950 flex flex-col justify-between animate-slide-in"
          >
            <div>
              <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-900">
                <img src="/logo.png" alt="VESA" className="h-7 w-auto" />
                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={linkClass(item.href)}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

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
              <form action={logoutAction}>
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
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Shortcut Bar */}
            <button 
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-slate-300 rounded-xl transition-all text-xs text-left w-48 sm:w-64"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search everywhere...</span>
              <span className="ml-auto text-[9px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-semibold text-slate-500">⌘K</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono uppercase tracking-wider">Production Platform</span>
            <div className="h-4 w-px bg-slate-900 hidden sm:block" />
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
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

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
