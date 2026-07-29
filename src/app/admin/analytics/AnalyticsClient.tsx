'use client';

import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  CheckCircle2, 
  Zap, 
  HardDrive,
  FolderKanban,
  Activity,
  Calendar,
  User
} from 'lucide-react';

interface AnalyticsLog {
  id: string;
  action: string;
  entity: string;
  timestamp: Date;
  user: {
    name: string;
    role: string;
  };
}

interface AnalyticsData {
  totalRevenue: number;
  projectsCount: number;
  completedProjects: number;
  activeClients: number;
  tasksCount: number;
  completedTasks: number;
  voiceNotesCount: number;
  filesCount: number;
  recentActivity: AnalyticsLog[];
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const {
    totalRevenue,
    projectsCount,
    completedProjects,
    activeClients,
    tasksCount,
    completedTasks,
    voiceNotesCount,
    filesCount,
    recentActivity,
  } = data;

  const taskRatio = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;
  const projectRatio = projectsCount > 0 ? Math.round((completedProjects / projectsCount) * 100) : 0;

  // Mock Gemini API usage rates
  const mockApiTokenConsumption = {
    promptTokens: 148200,
    completionTokens: 32400,
    totalCalls: voiceNotesCount || 8
  };

  const metrics = [
    { label: 'Active Clients', value: activeClients, icon: User, progress: 100, color: 'text-primary' },
    { label: 'Completed Projects', value: `${completedProjects}/${projectsCount}`, icon: FolderKanban, progress: projectRatio, color: 'text-success' },
    { label: 'Tasks Completed', value: `${completedTasks}/${tasksCount}`, icon: CheckCircle2, progress: taskRatio, color: 'text-primary' },
    { label: 'Files Vault Count', value: filesCount, icon: HardDrive, progress: Math.min(100, (filesCount / 20) * 100), color: 'text-secondary' },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Analytics</h1>
        <p className="text-muted text-sm font-semibold">Track financial collections, sprint completion rates, and platform storage metrics.</p>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-surface border border-border rounded-[20px] flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted">Collected Revenue</span>
            <p className="text-xl font-bold text-success">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 rounded-[12px] border border-success/20 bg-success/10 text-success shrink-0">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-[20px] flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted">Sprint Task Velocity</span>
            <p className="text-xl font-bold text-white">{taskRatio}% Done</p>
          </div>
          <div className="p-3 rounded-[12px] border border-border bg-card text-primary shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Columns: Core Performance & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Indices */}
          <div className="bg-surface border border-border p-6 rounded-[20px] space-y-6 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform Performance Indices</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.map((m, idx) => (
                <div key={idx} className="bg-card border border-border p-4 rounded-[16px] space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold text-muted">{m.label}</span>
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <p className="text-base font-bold text-white tracking-tight">{m.value}</p>
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-background border border-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operations Activity */}
          <div className="bg-surface border border-border p-6 rounded-[20px] space-y-4 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-muted block border-b border-border pb-1.5">Recent Operations Activity</span>
            
            <div className="divide-y divide-border">
              {recentActivity.length > 0 ? (
                recentActivity.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">{act.action}</span>
                        <span className="text-[9px] text-muted block mt-0.5">Actor: {act.user.name} ({act.user.role})</span>
                      </div>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider bg-background border border-border text-muted px-2 py-0.5 rounded font-bold shrink-0">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No recent operations recorded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Gemini API & Telemetry */}
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-[20px] space-y-6 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Zap className="w-4 h-4 text-warning" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Gemini LLM API Telemetry</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border p-4 rounded-[16px] space-y-3.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-muted block font-medium">Token Consumption Summary</span>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted">Prompt Input Tokens</span>
                    <span className="text-foreground font-mono">{mockApiTokenConsumption.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted">Response Output Tokens</span>
                    <span className="text-foreground font-mono">{mockApiTokenConsumption.completionTokens.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-350">Aggregate API Calls</span>
                    <span className="text-primary font-mono">{mockApiTokenConsumption.totalCalls} Calls</span>
                  </div>
                </div>
              </div>

              {/* Status card */}
              <div className="bg-card border border-border p-4 rounded-[16px] flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted block">LLM Endpoint Status</span>
                  <p className="text-xs font-bold text-success mt-0.5">Gemini-1.5-Flash Online</p>
                </div>
                <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
