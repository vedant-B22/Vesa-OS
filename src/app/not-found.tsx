'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl animate-scale-up">
        {/* Visual Icon */}
        <div className="w-16 h-16 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Page Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed pt-2">
            The workspace folder or control panel route you are trying to access does not exist or has been relocated.
          </p>
        </div>

        {/* Navigation Action */}
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-xs font-semibold text-slate-200 rounded-xl transition-all shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
