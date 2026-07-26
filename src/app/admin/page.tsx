import Link from 'next/link';
import { prisma } from '@/lib/db';
import { DeliverableStatus } from '@prisma/client';
import {
  Users,
  FolderKanban,
  FileCheck,
  Video,
  Plus,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Retrieve metrics
  const clientsCount = await prisma.client.count();
  const projectsCount = await prisma.project.count();
  const pendingDeliverables = await prisma.deliverable.count({
    where: { status: DeliverableStatus.PENDING_REVIEW },
  });
  
  const upcomingMeetings = await prisma.meeting.findMany({
    where: { scheduledAt: { gte: new Date() } },
    include: { client: true },
    orderBy: { scheduledAt: 'asc' },
    take: 4,
  });

  const recentProjects = await prisma.project.findMany({
    include: { client: true },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  });

  const stats = [
    { label: 'Total Clients', value: clientsCount, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Active Projects', value: projectsCount, icon: FolderKanban, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending Reviews', value: pendingDeliverables, icon: FileCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Upcoming Meetings', value: upcomingMeetings.length, icon: Video, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm">Monitor Vesa Studios client engagements and deliverables status.</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/clients"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Client
          </Link>
          <Link
            href="/admin/projects"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-900 rounded-2xl flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl border ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Projects list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Recent Activity</h2>
            <Link
              href="/admin/projects"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              All Projects
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl divide-y divide-slate-900 overflow-hidden">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="p-5 flex items-center justify-between hover:bg-slate-900/20 transition-colors">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                      {project.client.name}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-200">{project.name}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress Bar */}
                    <div className="flex flex-col items-end gap-1 hidden sm:flex">
                      <span className="text-xs text-slate-400 font-semibold">{project.progress}%</span>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                No projects created yet. Start by creating a project!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Meetings and Calendar summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Upcoming Meetings</h2>
            <Link
              href="/admin/meetings"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Schedule
              <Plus className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex gap-4 items-start pb-4 border-b border-slate-900 last:pb-0 last:border-b-0">
                  <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-400 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-200 truncate">{meeting.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {meeting.client.name} &bull; {new Date(meeting.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {meeting.googleMeetLink && (
                      <a
                        href={meeting.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Join Google Meet
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No meetings scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
