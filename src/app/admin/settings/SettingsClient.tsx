'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  Database, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface SettingsClientProps {
  envState: {
    geminiKeyExists: boolean;
    supabaseUrl: string;
    supabaseUrlExists: boolean;
    dbUrlExists: boolean;
  };
}

export function SettingsClient({ envState }: SettingsClientProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg('Branding configurations updated successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-slate-400 text-sm">Review platform integration links, verify environment API variables, and manage workspace parameters.</p>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Environment variables status (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Integration Integrities</h3>
            </div>

            <div className="divide-y divide-slate-900">
              {/* Gemini Key */}
              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-200 block">Google Gemini Generative AI</span>
                  <span className="text-[10px] text-slate-500 block">Used for audio notes translation and structured questionnaire feedback generation.</span>
                </div>
                {envState.geminiKeyExists ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle className="w-3 h-3" />
                    CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                    <XCircle className="w-3 h-3" />
                    DISCONNECTED
                  </span>
                )}
              </div>

              {/* Supabase URL */}
              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-200 block">Supabase Client Instance</span>
                  <span className="text-[10px] text-slate-500 block">Used for real-time WebSocket channels, chat broadcast, and user onboarding side-effects.</span>
                </div>
                {envState.supabaseUrlExists ? (
                  <span className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle className="w-3 h-3" />
                      CONNECTED
                    </span>
                    <span className="text-[9px] font-mono text-slate-600 truncate max-w-[150px]">{envState.supabaseUrl}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                    <XCircle className="w-3 h-3" />
                    DISCONNECTED
                  </span>
                )}
              </div>

              {/* Database URL */}
              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-200 block">Prisma Postgres DB Proxy</span>
                  <span className="text-[10px] text-slate-500 block">Connected transaction/session pool hosting active schemas and tables.</span>
                </div>
                {envState.dbUrlExists ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle className="w-3 h-3" />
                    CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                    <XCircle className="w-3 h-3" />
                    DISCONNECTED
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200">How to manage secret keys?</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Secret tokens, passwords, and service role keys are managed through secure environment variables (`.env`) rather than exposed inside database models. To modify keys, edit the configuration variable settings inside your Vercel Project Console.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Tenant Branding Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <Settings className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">General Branding</h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Application Name</label>
                <input
                  type="text"
                  defaultValue="VESA OS"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Host Domain</label>
                <input
                  type="text"
                  defaultValue="vesa-os.vercel.app"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Default Locale</label>
                <select
                  defaultValue="en-US"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
              >
                Save Configurations
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
