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
  Search,
  Bell,
  Layers
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
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuLink[] = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'AI Workspace', href: '/admin/ai', icon: Sparkles },
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
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] transition-all duration-150 text-xs font-semibold ${
      isActive 
        ? 'bg-primary text-white shadow-md shadow-primary/10' 
        : 'text-muted hover:text-foreground hover:bg-card border border-transparent hover:border-border'
    }`;
  };

  // Simple breadcrumbs generator
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const href = '/' + parts.slice(0, index + 1).join('/');
      const isLast = index === parts.length - 1;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      return (
        <span key={href} className="flex items-center gap-1.5">
          <span className="text-border">/</span>
          {isLast ? (
            <span className="text-foreground font-semibold">{label}</span>
          ) : (
            <Link href={href} className="text-muted hover:text-foreground transition-colors">{label}</Link>
          )}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar - Desktop */}
      <aside 
        className={`border-r border-border bg-surface flex flex-col justify-between hidden md:flex transition-all duration-200 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Workspace Switcher header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border relative">
            {!isCollapsed && (
              <button 
                onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-card border border-transparent hover:border-border rounded-[14px] transition-all text-left w-full"
              >
                <div className="w-6 h-6 rounded-[8px] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  VS
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-foreground leading-tight truncate">Vesa Studios</span>
                  <span className="text-[8px] text-muted leading-tight truncate">Enterprise Console</span>
                </div>
              </button>
            )}
            {isCollapsed && (
              <div className="mx-auto">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-md">
                  V
                </div>
              </div>
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3.5 top-4.5 p-1 bg-surface border border-border rounded-full hover:bg-card text-muted hover:text-foreground transition-colors z-20 shadow-md"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Dropdown Workspace Switcher */}
            {showWorkspaceSwitcher && !isCollapsed && (
              <div className="absolute top-14 left-4 right-4 bg-card border border-border rounded-[16px] p-2 shadow-2xl z-30 animate-scale-up space-y-1">
                <div className="px-2.5 py-1.5 text-[9px] uppercase font-bold text-muted">Workspace Environments</div>
                <button className="w-full flex items-center gap-2 p-2 bg-surface border border-border rounded-[10px] text-left">
                  <div className="w-5 h-5 rounded-[6px] bg-primary flex items-center justify-center text-[9px] font-bold text-white shrink-0">P</div>
                  <span className="text-xs font-semibold text-foreground">Production Hub</span>
                </button>
                <button className="w-full flex items-center gap-2 p-2 hover:bg-surface rounded-[10px] text-left text-muted">
                  <div className="w-5 h-5 rounded-[6px] bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">S</div>
                  <span className="text-xs font-semibold">Staging Sandbox</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
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

        {/* User profile footer */}
        <div className="p-4 border-t border-border flex flex-col gap-2.5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold uppercase text-foreground shrink-0 shadow-inner">
              {name.slice(0, 2)}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">{name}</span>
                <span className="text-[10px] text-muted truncate">{user.email}</span>
              </div>
            )}
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className={`w-full flex items-center gap-3 py-2 text-xs font-semibold text-danger hover:text-red-400 hover:bg-red-950/20 rounded-[12px] border border-transparent hover:border-red-950/30 transition-colors ${
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
            className="w-64 h-full border-r border-border bg-background flex flex-col justify-between animate-slide-in animate-fade-in"
          >
            <div>
              <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
                <div className="w-6 h-6 rounded-[8px] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  VS
                </div>
                <h2 className="text-xs font-bold text-foreground">Vesa Studios</h2>
              </div>
              <nav className="p-4 space-y-1.5">
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

            <div className="p-4 border-t border-border flex flex-col gap-2.5">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold uppercase text-foreground">
                  {name.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{name}</span>
                  <span className="text-[10px] text-muted truncate">{user.email}</span>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-danger hover:text-red-400 hover:bg-red-950/20 rounded-[12px] transition-colors"
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
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Sticky Navbar */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background/60 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 hover:bg-card border border-transparent hover:border-border rounded-[10px] text-muted hover:text-foreground md:hidden transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumbs */}
            <div className="items-center gap-1.5 text-xs text-muted hidden sm:flex shrink-0">
              <span className="font-semibold text-slate-500">VESA OS</span>
              {getBreadcrumbs()}
            </div>
            <span className="text-xs font-semibold text-foreground sm:hidden truncate">VESA OS</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Trigger Button */}
            <button 
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-surface border border-border hover:border-border text-muted hover:text-foreground rounded-[14px] transition-all text-xs text-left w-36 sm:w-48 shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">Search commands...</span>
              <span className="ml-auto text-[9px] bg-background px-1.5 py-0.5 rounded border border-border font-semibold text-slate-500">⌘K</span>
            </button>

            {/* Notification Bell */}
            <button className="p-2 hover:bg-card border border-transparent hover:border-border rounded-[12px] text-muted hover:text-foreground transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse" />
            </button>

            <div className="h-4 w-px bg-border" />
            
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-card border border-transparent hover:border-border rounded-[12px] text-muted hover:text-foreground transition-all"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Children Container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
