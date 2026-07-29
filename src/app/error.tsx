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
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-surface border border-border rounded-[20px] p-8 shadow-2xl animate-scale-up">
        {/* Visual Icon */}
        <div className="w-16 h-16 bg-background border border-border rounded-[14px] flex items-center justify-center mx-auto text-danger shadow-inner">
          <AlertOctagon className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white">System Collision</h1>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">An unexpected runtime exception occurred</h2>
          <p className="text-xs text-muted leading-relaxed pt-2 font-semibold">
            Vesa OS experienced a database query or property validation exception. Check database connections and credentials.
          </p>
        </div>

        {/* Reset Action */}
        <div className="pt-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger/30 text-xs font-bold text-danger rounded-[12px] transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Reload Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
