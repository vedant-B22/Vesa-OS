'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertOctagon } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Runtime system exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl animate-scale-up">
        {/* Visual Icon */}
        <div className="w-16 h-16 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-inner">
          <AlertOctagon className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">System Error</h1>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">An unexpected exception occurred</h2>
          <p className="text-xs text-slate-500 leading-relaxed pt-2">
            Vesa OS experienced a runtime rendering collision. Try resetting the cache or reloading the workspace.
          </p>
        </div>

        {/* Reset Action */}
        <div className="pt-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-xs font-semibold text-red-300 rounded-xl transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
