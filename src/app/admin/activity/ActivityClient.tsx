'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  SlidersHorizontal, 
  Activity, 
  Shield, 
  Database,
  FileText
} from 'lucide-react';

interface User {
  name: string;
  role: string;
  email: string | null;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  entity: string;
  metadata: string | null; // JSON String
  user: User;
}

interface ActivityClientProps {
  logs: ActivityLog[];
}

export function ActivityClient({ logs }: ActivityClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Client':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Project':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'Task':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Activity Logs</h1>
        <p className="text-slate-400 text-sm">Chronological system audit logs. Track modifications made by administrators and client users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/10 border border-slate-900 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl w-full sm:max-w-xs text-slate-400">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by action or admin user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none text-slate-200 w-full placeholder-slate-500"
          />
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            <option value="Client">Clients</option>
            <option value="Project">Projects</option>
            <option value="Task">Tasks</option>
            <option value="Invoice">Invoices</option>
            <option value="Payment">Payments</option>
            <option value="User">Users</option>
            <option value="Deliverable">Deliverables</option>
            <option value="VoiceNote">Voice Notes</option>
          </select>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-lg">
        {filteredLogs.length > 0 ? (
          <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative animate-fade-in">
                {/* Timeline dot icon */}
                <div className="absolute -left-10 top-0.5 p-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  {getEntityIcon(log.entity)}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-200">{log.action}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>
                        {new Date(log.timestamp).toLocaleDateString()} at{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="text-slate-300 font-semibold">{log.user.name}</span>
                    <span>&bull;</span>
                    <span className="text-slate-500">{log.user.email}</span>
                    <span>&bull;</span>
                    <span className="text-slate-500 uppercase tracking-wider bg-slate-950 px-1.5 py-0.2 rounded border border-slate-900 text-[8px] font-bold">
                      {log.entity}
                    </span>
                  </div>

                  {log.metadata && (
                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl max-w-lg">
                      <span className="text-[9px] uppercase font-bold text-slate-600 block mb-1">Context Parameters</span>
                      <pre className="text-[9px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">{log.metadata}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            No matching audit logs found.
          </div>
        )}
      </div>

    </div>
  );
}
