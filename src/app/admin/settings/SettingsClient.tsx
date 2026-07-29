'use client';

import React from 'react';
import { 
  Settings, 
  Database, 
  Cpu, 
  Link2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EnvState {
  geminiKeyExists: boolean;
  supabaseUrl: string;
  supabaseUrlExists: boolean;
  dbUrlExists: boolean;
}

interface SettingsClientProps {
  envState: EnvState;
}

export function SettingsClient({ envState }: SettingsClientProps) {
  const {
    geminiKeyExists,
    supabaseUrl,
    supabaseUrlExists,
    dbUrlExists,
  } = envState;

  const integrations = [
    {
      name: 'Prisma Postgres Connection',
      description: 'SaaS relational data serverless instance.',
      status: dbUrlExists,
      icon: Database,
    },
    {
      name: 'Gemini AI Integration',
      description: 'Transcribes voice briefs and maps action task checklists.',
      status: geminiKeyExists,
      icon: Cpu,
    },
    {
      name: 'Supabase storage vault',
      description: `Handles static file vault uploads and deliverables hosting. URL: ${supabaseUrl}`,
      status: supabaseUrlExists,
      icon: Link2,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-muted text-sm font-semibold">Monitor connected environment API secrets and framework integration statuses.</p>
      </div>

      {/* Integration Checks Box */}
      <div className="bg-surface border border-border p-6 rounded-[20px] space-y-6 shadow-lg">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Settings className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Integrations</h2>
        </div>

        <div className="divide-y divide-border">
          {integrations.map((item, idx) => (
            <div key={idx} className="py-5 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-card border border-border text-muted rounded-[14px] flex-shrink-0 shadow-sm">
                  <item.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white leading-tight">{item.name}</h3>
                  <p className="text-xs text-muted leading-normal font-semibold">{item.description}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {item.status ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 rounded-[12px] text-[10px] font-bold text-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/20 rounded-[12px] text-[10px] font-bold text-danger">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Offline
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database targets brief */}
      <div className="bg-surface border border-border p-6 rounded-[20px] space-y-4 shadow-lg">
        <span className="text-[10px] uppercase font-bold text-muted block border-b border-border pb-1.5">Database Specifications</span>
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
          <div>
            <span className="text-[9px] uppercase font-bold text-muted block">Database Server Target</span>
            <span className="text-foreground">Prisma Postgres serverless proxy</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-muted block">Connection Endpoint</span>
            <span className="text-foreground font-mono">db.prisma.io:5432</span>
          </div>
        </div>
      </div>

    </div>
  );
}
