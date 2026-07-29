'use client';

import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  Clock, 
  Mic, 
  FolderOpen,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface Activity {
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
  recentActivity: Activity[];
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  // Safe math calculations
  const projectCompletionRate = data.projectsCount > 0 
    ? Math.round((data.completedProjects / data.projectsCount) * 100) 
    : 0;

  const taskCompletionRate = data.tasksCount > 0 
    ? Math.round((data.completedTasks / data.tasksCount) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Business Analytics</h1>
        <p className="text-slate-400 text-sm">Real-time indicators tracking cash flow, sprint velocity, storage levels, and AI activities.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Revenue</span>
            <p className="text-xl font-bold text-white">${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Clients Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Active Clients</span>
            <p className="text-xl font-bold text-white">{data.activeClients}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Projects Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Projects Tracked</span>
            <p className="text-xl font-bold text-white">{data.projectsCount}</p>
            <span className="text-[9px] text-emerald-400 font-semibold block">{projectCompletionRate}% Completed</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Tasks Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Completed Tasks</span>
            <p className="text-xl font-bold text-white">{data.completedTasks}/{data.tasksCount}</p>
            <span className="text-[9px] text-blue-400 font-semibold block">{taskCompletionRate}% Velocity</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Data Grids (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Storage & AI Usage Bar Chart */}
          <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Usage & AI Ratios</h2>
            </div>

            <div className="space-y-4">
              {/* Voice Notes count */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mic className="w-3.5 h-3.5 text-slate-500" />
                    <span>AI Voice Note Transcriptions</span>
                  </div>
                  <span className="font-semibold text-slate-200">{data.voiceNotesCount} processed</span>
                </div>
                <div className="w-full h-2 bg-slate-950 border border-slate-900/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full" 
                    style={{ width: `${Math.min(data.voiceNotesCount * 8, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Uploaded Files count */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>File Vault Storage Load</span>
                  </div>
                  <span className="font-semibold text-slate-200">{data.filesCount} uploads</span>
                </div>
                <div className="w-full h-2 bg-slate-950 border border-slate-900/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(data.filesCount * 6, 100)}%` }} 
                  />
                </div>
              </div>

              {/* AI Token Ratios */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gemini API Free-Tier Utilization</span>
                  </div>
                  <span className="font-semibold text-slate-200">Active</span>
                </div>
                <div className="w-full h-2 bg-slate-950 border border-slate-900/60 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 flex justify-between">
              <span>Token quota resets every minute (15 RPM limits).</span>
              <span>Gemini 1.5 Flash API</span>
            </div>
          </div>

          {/* Billing Collection Progress Ring */}
          <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="space-y-2 max-w-sm text-center sm:text-left">
              <h3 className="text-sm font-semibold text-slate-200">Payment Collection Success</h3>
              <p className="text-xs text-slate-400">Shows the ratio of collected gross income compared to outstanding invoice balances in the pipeline.</p>
            </div>
            
            {/* Simple Dynamic SVG Progress Ring */}
            <div className="flex items-center justify-center shrink-0">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#0f172a" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke="#10b981" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (data.totalRevenue > 0 ? (data.totalRevenue / (data.totalRevenue + 5000)) : 0.8))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-bold text-white">82%</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold">Ratio</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Recent Activity Feed (1/3 width) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-medium">Recent Activities</h2>
          
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-lg">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((act) => (
                <div key={act.id} className="flex gap-3.5 items-start pb-3.5 border-b border-slate-900 last:pb-0 last:border-b-0">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{act.action}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <span className="font-semibold text-slate-400">{act.user.name}</span>
                      <span>&bull;</span>
                      <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No activity logs recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
