import { getProjects, createProjectRecord, deleteProjectRecord, getClients } from '../actions';
import { FolderKanban, Plus, Calendar, Percent, Trash2, ArrowRight } from 'lucide-react';
import { ProjectStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);

  const statusColors: Record<ProjectStatus, string> = {
    PLANNING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    PAUSED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Project Tracker</h1>
        <p className="text-slate-400 text-sm">Create client workspaces, update build statuses, and adjust progress metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Projects Grid List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-medium">All Projects</h2>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 hover:border-slate-800 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 truncate max-w-[150px]">
                        {project.client.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusColors[project.status]}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-200">{project.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{project.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold text-slate-300">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900/30">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline dates and actions */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-900/50">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} -{' '}
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>

                      <form action={deleteProjectRecord.bind(null, project.id)}>
                        <button
                          type="submit"
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-16 text-center text-slate-500 text-sm">
              No projects created. Start by creating a project on the right side.
            </div>
          )}
        </div>

        {/* Right Side: Create Project Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Project</h2>
            </div>

            <form action={async (formData) => {
              'use server';
              await createProjectRecord(formData);
            }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Client</label>
                <select
                  name="clientId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Project Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Website Rebranding"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Scope of work details..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    name="status"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Progress (%)</label>
                  <input
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={0}
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2"
              >
                Create Project
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
