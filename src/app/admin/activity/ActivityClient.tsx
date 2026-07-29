'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Activity, 
  Search, 
  Calendar, 
  User, 
  Layers
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  metadata: string | null;
  timestamp: Date;
  user: {
    name: string;
    role: string;
    email: string;
  };
}

interface ActivityClientProps {
  logs: ActivityLog[];
}

export function ActivityClient({ logs }: ActivityClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    return log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.entity.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Activity Audit Logs</h1>
        <p className="text-muted text-sm font-semibold">Monitor administration operations, client uploads, and billing invoices logs.</p>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-surface border border-border rounded-[20px] max-w-md text-muted shadow-sm">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Filter audit logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs outline-none text-foreground w-full placeholder-slate-500 font-semibold"
        />
      </div>

      {/* Timeline Feed Container */}
      <div className="bg-surface border border-border p-6 rounded-[20px] shadow-lg relative">
        {filteredLogs.length > 0 ? (
          <div className="relative border-l border-border pl-6 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group animate-fade-in">
                {/* Timeline node */}
                <div className="absolute -left-9.5 top-0.5 p-1 bg-background border border-border text-muted rounded-full shrink-0 group-hover:border-primary transition-all">
                  <Activity className="w-3 h-3 text-slate-500" />
                </div>

                {/* Log card */}
                <div className="bg-card border border-border p-4 rounded-[16px] space-y-2.5 shadow-sm hover:border-border/80 transition-colors">
                  
                  {/* Header metadata */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{log.action}</span>
                      <span className="text-[8px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 rounded font-bold">
                        {log.entity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[9px] text-muted font-semibold">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Body description */}
                  <div className="text-xs text-slate-355 leading-relaxed font-semibold">
                    {log.metadata || 'No additional payload metadata recorded.'}
                  </div>

                  {/* Actor details footer */}
                  <div className="flex items-center gap-1.5 text-[9px] text-muted font-bold pt-1.5">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Actor: {log.user.name} &bull; <span className="text-slate-500 font-mono">{log.user.email}</span> &bull; <span className="text-primary font-mono">{log.user.role}</span></span>
                  </div>

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 text-xs shadow-inner">
            No system audit logs found.
          </div>
        )}
      </div>

    </div>
  );
}
