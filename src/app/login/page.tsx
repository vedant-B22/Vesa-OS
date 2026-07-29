'use client';

import React, { useActionState, useState } from 'react';
import { login, forgotPassword } from './actions';
import { ShieldCheck, UserCheck, KeyRound, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [activePortal, setActivePortal] = useState<'admin' | 'client'>('client');
  const [showForgot, setShowForgot] = useState(false);

  // React 19 useActionState hooks
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [forgotState, forgotAction, isForgotPending] = useActionState(forgotPassword, null);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background soft glow elements */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card Surface */}
      <div className="relative w-full max-w-md p-8 mx-4 bg-surface border border-border rounded-[20px] shadow-2xl transition-all duration-300">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="VESA OS" className="h-8 w-auto object-contain mb-2" />
          <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Enterprise Operating System</p>
        </div>

        {/* Portal switch options */}
        {!showForgot && (
          <div className="grid grid-cols-2 p-1 gap-1 bg-background border border-border rounded-[14px] mb-6">
            <button
              onClick={() => setActivePortal('client')}
              type="button"
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[10px] transition-all duration-150 ${
                activePortal === 'client'
                  ? 'bg-card text-white border border-border shadow-sm font-bold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Client Workspace
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              type="button"
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[10px] transition-all duration-150 ${
                activePortal === 'admin'
                  ? 'bg-card text-white border border-border shadow-sm font-bold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Studios Admin
            </button>
          </div>
        )}

        {/* Credentials Form */}
        {!showForgot ? (
          <form action={loginAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={activePortal === 'admin' ? 'admin@vesastudios.com' : 'client@demo.com'}
                className="w-full px-4 py-3 bg-background border border-border rounded-[14px] text-foreground placeholder-slate-600 text-xs font-semibold focus:outline-none focus:border-primary/80 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-[10px] uppercase font-bold text-slate-500">
                  Secure Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[10px] text-primary hover:text-blue-400 font-bold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-border rounded-[14px] text-foreground placeholder-slate-600 text-xs font-semibold focus:outline-none focus:border-primary/80 transition-colors"
              />
            </div>

            {/* Error banners */}
            {loginState?.error && (
              <div className="p-3 text-xs text-danger bg-red-950/20 border border-danger/20 rounded-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginState.error}</span>
              </div>
            )}

            {/* Submit portal key */}
            <button
              type="submit"
              disabled={isLoginPending}
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-55"
            >
              {isLoginPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating secure key...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In to Platform</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Forgot password flow */
          <form action={forgotAction} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Reset Platform Key</h3>
              <p className="text-[10px] text-muted mt-1 leading-relaxed">
                Provide your email address to deliver a secure password reset link to your mailbox.
              </p>
            </div>

            <div>
              <label htmlFor="reset-email" className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-[14px] text-foreground placeholder-slate-600 text-xs font-semibold focus:outline-none focus:border-primary/80 transition-colors"
              />
            </div>

            {forgotState?.error && (
              <div className="p-3 text-xs text-danger bg-red-950/20 border border-danger/20 rounded-[12px]">
                {forgotState.error}
              </div>
            )}
            {forgotState?.success && (
              <div className="p-3 text-xs text-success bg-emerald-950/20 border border-success/20 rounded-[12px]">
                {forgotState.success}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="flex-1 py-3 bg-background border border-border text-muted hover:text-foreground text-xs font-bold rounded-[14px] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isForgotPending}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] disabled:opacity-55 flex items-center justify-center gap-1.5"
              >
                {isForgotPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Send Reset</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Inline fallback for AlertCircle imports
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
