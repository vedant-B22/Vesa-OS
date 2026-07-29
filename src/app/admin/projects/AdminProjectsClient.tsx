'use client';

import React, { useState, useTransition } from 'react';
import { 
  createProjectRecord, 
  deleteProjectRecord, 
  createTaskRecord, 
  toggleTaskStatus, 
  deleteTaskRecord 
} from '../actions';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  Trash2, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Clock, 
  Tag, 
  Search, 
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ProjectStatus, Priority } from '@prisma/client';

interface Client {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: Priority;
  dueDate: Date | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  startDate: Date | null;
  endDate: Date | null;
  client: Client;
  tasks: Task[];
}

interface AdminProjectsClientProps {
  initialProjects: Project[];
  clients: Client[];
}

export function AdminProjectsClient({ initialProjects, clients }: AdminProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Form states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [taskErrorMsg, setTaskErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();

  const statusColors: Record<ProjectStatus, string> = {
    PLANNING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    PAUSED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const priorityColors: Record<Priority, string> = {
    LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Create Project
  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createProjectRecord(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Project created successfully!');
        form.reset();
        window.location.reload();
      }
    });
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated tasks, files, and deliverables will be permanently deleted.')) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      await deleteProjectRecord(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) setSelectedProject(null);
      setSuccessMsg('Project deleted successfully.');
    });
  };

  // Add Task to Project
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;
    setTaskErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('projectId', selectedProject.id);

    startTaskTransition(async () => {
      const res = await createTaskRecord(formData);
      if (res?.error) {
        setTaskErrorMsg(res.error);
      } else {
        form.reset();
        window.location.reload();
      }
    });
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string) => {
    startTaskTransition(async () => {
      const res = await toggleTaskStatus(taskId);
      if (res?.error) {
        alert(res.error);
      } else if (res?.task && selectedProject) {
        // Update local selected state
        setSelectedProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, isCompleted: res.task.isCompleted } : t)
          };
        });
        // Update projects state
        setProjects(prev => prev.map(p => {
          if (p.id !== selectedProject.id) return p;
          return {
            ...p,
            tasks: p.tasks.map(t => t.id === taskId ? { ...t, isCompleted: res.task.isCompleted } : t)
          };
        }));
      }
    });
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    startTaskTransition(async () => {
      const res = await deleteTaskRecord(taskId);
      if (res?.error) {
        alert(res.error);
      } else if (selectedProject) {
        setSelectedProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
          };
        });
        setProjects(prev => prev.map(p => {
          if (p.id !== selectedProject.id) return p;
          return {
            ...p,
            tasks: p.tasks.filter(t => t.id !== taskId)
          };
        }));
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Project Tracker</h1>
        <p className="text-muted text-sm">Create client workspaces, track build progress, and manage sprint task checklists.</p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-[14px] text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-success/10 border border-success/20 rounded-[14px] text-xs text-success flex items-center gap-2">
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface border border-border p-3.5 rounded-[20px] shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-background border border-border rounded-[14px] w-full sm:max-w-xs text-muted">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none text-foreground w-full placeholder-slate-500 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-[14px] text-xs text-slate-300 outline-none w-full sm:w-auto font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Projects Grid List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase font-medium">All Projects</h2>

          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface border border-border rounded-[20px] p-5 space-y-4 hover:border-border/80 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-background px-2 py-0.5 rounded border border-border truncate max-w-[150px]">
                        {project.client.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusColors[project.status]}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-200 group-hover:text-primary transition-colors leading-tight">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">{project.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {/* Progress Bar */}
                    <div className="space-y-1 border-t border-border/40 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted text-[9px] font-bold uppercase">Completion</span>
                        <span className="font-semibold text-slate-350">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-background rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline dates & Manage tasks */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-border">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} -{' '}
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex items-center gap-1 text-[10px] bg-background hover:bg-card text-primary hover:text-blue-400 border border-border px-2 py-1 rounded-[10px] font-bold transition-all"
                        >
                          Tasks ({project.tasks?.filter(t => t.isCompleted).length || 0}/{project.tasks?.length || 0})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 text-muted hover:text-danger hover:bg-red-950/20 rounded-[10px] border border-transparent hover:border-red-950/30 transition-colors"
                          title="Delete Project"
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-[20px] p-16 text-center text-slate-500 text-xs shadow-inner">
              No matching projects found.
            </div>
          )}
        </div>

        {/* Right Side: Create Project Form */}
        <div>
          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FolderKanban className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Project</h2>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Select Client</label>
                <select
                  name="clientId"
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
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
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Project Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Website Rebranding"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Scope of work details..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 focus:outline-none focus:border-primary/80 transition-colors resize-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                  <select
                    name="status"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
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
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Progress (%)</label>
                  <input
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={0}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-55"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Create Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Relational Tasks Modal/Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-white">Project Tasks Checklist</h3>
                <p className="text-[10px] text-muted mt-0.5">Project: {selectedProject.name}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 hover:bg-card border border-transparent hover:border-border rounded-[8px] text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Error Warning */}
            {taskErrorMsg && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-[12px] text-xs text-danger flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{taskErrorMsg}</span>
              </div>
            )}

            {/* Quick Task Creation Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 bg-background p-2 border border-border rounded-[16px]">
              <input
                name="title"
                type="text"
                required
                placeholder="Add task to sprint... (e.g. Code auth forms)"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder-slate-500 px-2 font-semibold"
              />
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="bg-card border border-border text-[9px] font-bold text-slate-300 rounded-[10px] px-2 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Med</option>
                <option value="HIGH">High</option>
              </select>
              <button
                type="submit"
                disabled={isTaskPending}
                className="bg-primary hover:bg-blue-500 text-white px-3 py-1.5 rounded-[10px] text-xs font-bold shrink-0 transition-colors flex items-center gap-1 disabled:opacity-55"
              >
                {isTaskPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                selectedProject.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-background border border-border hover:border-border/80 rounded-[16px] flex items-center justify-between hover:border-slate-800 transition-all"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-center gap-3 text-left min-w-0"
                    >
                      {task.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-700 shrink-0" />
                      )}
                      <div className="space-y-0.5">
                        <span className={`text-xs block leading-tight font-semibold ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[8px] text-muted">
                          <Tag className="w-3 h-3 text-slate-650" />
                          <span className={`px-1.5 py-0.2 rounded border ${priorityColors[task.priority]}`}>{task.priority}</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-600 hover:text-danger hover:bg-red-950/20 rounded-[8px] transition-colors shrink-0"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No tasks assigned to this project yet. Use the prompt bar above to create one.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end text-[9px] uppercase font-bold text-muted">
              <span>Sync complete</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
