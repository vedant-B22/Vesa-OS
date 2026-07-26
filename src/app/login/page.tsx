'use client';

import { useActionState, useState } from 'react';
import { login, forgotPassword } from './actions';
import { ShieldCheck, UserCheck, KeyRound, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [activePortal, setActivePortal] = useState<'admin' | 'client'>('client');
  const [showForgot, setShowForgot] = useState(false);

  // React 19 useActionState hooks
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [forgotState, forgotAction, isForgotPending] = useActionState(forgotPassword, null);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md p-8 mx-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VESA OS
            </span>
          </div>
          <p className="text-sm text-slate-400">Vesa Studios Production Environment</p>
        </div>

        {/* Portal Selection Toggles */}
        {!showForgot && (
          <div className="grid grid-cols-2 p-1 gap-1 bg-slate-950/80 border border-slate-800/50 rounded-xl mb-6">
            <button
              onClick={() => setActivePortal('client')}
              type="button"
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activePortal === 'client'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Client Portal
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              type="button"
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activePortal === 'admin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Studios Admin
            </button>
          </div>
        )}

        {/* Form Container */}
        {!showForgot ? (
          <form action={loginAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={activePortal === 'admin' ? 'admin@vesastudios.com' : 'hello@client.com'}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-150"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-150"
              />
            </div>

            {/* Error Message */}
            {loginState?.error && (
              <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
                {loginState.error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoginPending}
              className="relative w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              {isLoginPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Sign In to {activePortal === 'admin' ? 'OS Admin' : 'Workspace'}
                </>
              )}
            </button>
          </form>
        ) : (
          /* Forgot Password Portal */
          <form action={forgotAction} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Reset Password</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your email address and we will send you a secure link to reset your password.
              </p>
            </div>

            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-150"
              />
            </div>

            {/* Response Alerts */}
            {forgotState?.error && (
              <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
                {forgotState.error}
              </div>
            )}
            {forgotState?.success && (
              <div className="p-3 text-xs text-green-400 bg-green-950/40 border border-green-900/50 rounded-xl">
                {forgotState.success}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700/50 transition-colors"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={isForgotPending}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isForgotPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
