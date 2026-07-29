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
  Sparkles
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
    { label: 'Total Clients', value: clientsCount, icon: Users, color: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Active Projects', value: projectsCount, icon: FolderKanban, color: 'text-success bg-success/10 border-success/20' },
    { label: 'Pending Reviews', value: pendingDeliverables, icon: FileCheck, color: 'text-warning bg-warning/10 border-warning/20' },
    { label: 'Upcoming Meetings', value: upcomingMeetings.length, icon: Video, color: 'text-secondary bg-secondary/10 border-secondary/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-muted text-xs font-semibold mt-0.5">Monitor client workspaces, deliverables review pipelines, and business velocity.</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/clients"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface hover:bg-card border border-border rounded-[14px] text-xs font-semibold text-foreground transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Client
          </Link>
          <Link
            href="/admin/ai"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[14px] transition-all shadow-md shadow-primary/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Workspace
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-surface border border-border rounded-[20px] flex items-center justify-between shadow-sm hover:border-border/80 transition-all"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted">{stat.label}</span>
              <p className="text-xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-[12px] border ${stat.color} shrink-0`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Projects list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-muted uppercase">Recent Project Activity</h2>
            <Link
              href="/admin/projects"
              className="flex items-center gap-1 text-xs text-primary hover:text-blue-400 font-semibold transition-colors"
            >
              All Projects
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-[20px] divide-y divide-border overflow-hidden shadow-md">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="p-5 flex items-center justify-between hover:bg-card/40 transition-colors">
                  <div className="space-y-1 min-w-0 pr-4">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-background px-2 py-0.5 rounded border border-border truncate max-w-[130px] inline-block">
                      {project.client?.name || 'Unknown Client'}
                    </span>
                    <h3 className="text-sm font-bold text-foreground truncate">{project.name}</h3>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Progress Bar */}
                    <div className="flex flex-col items-end gap-1.5 hidden sm:flex">
                      <span className="text-[10px] text-muted font-bold">{project.progress}% Complete</span>
                      <div className="w-20 h-1 bg-background border border-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs">
                No active projects found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Meetings and Calendar summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-muted uppercase font-medium">Upcoming Syncs</h2>
            <Link
              href="/admin/meetings"
              className="flex items-center gap-1 text-xs text-primary hover:text-blue-400 font-semibold transition-colors"
            >
              Schedule
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-md">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex gap-3.5 items-start pb-4 border-b border-border last:pb-0 last:border-b-0">
                  <div className="p-2.5 bg-background border border-border rounded-[12px] text-slate-400 flex-shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-bold text-foreground truncate">{meeting.title}</h3>
                    <p className="text-[10px] text-muted font-medium truncate">
                      {meeting.client?.name || 'Unknown Client'} &bull; {new Date(meeting.scheduledAt).toLocaleDateString()}
                    </p>
                    {meeting.googleMeetLink && (
                      <a
                        href={meeting.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[10px] text-primary hover:text-blue-400 font-bold"
                      >
                        Launch Google Meet
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No upcoming sync meetings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
