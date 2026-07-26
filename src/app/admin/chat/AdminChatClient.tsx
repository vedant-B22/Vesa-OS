'use client';

import { useState } from 'react';
import Chat from '@/components/shared/Chat';
import { MessageSquare, FolderKanban } from 'lucide-react';

interface AdminChatClientProps {
  projects: any[];
}

export default function AdminChatClient({ projects }: AdminChatClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || ''
  );

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Project Selector List */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Client Projects
        </h2>
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full p-4 rounded-2xl text-left border transition-all duration-200 ${
                selectedProjectId === project.id
                  ? 'bg-slate-900 border-blue-500/80 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/40 border-slate-900/60 hover:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {project.client.name}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 truncate">
                {project.name}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Chat Container */}
      <div className="lg:col-span-3">
        {activeProject ? (
          <Chat
            projectId={activeProject.id}
            projectName={activeProject.name}
            currentUserRole="ADMIN"
          />
        ) : (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-800" />
            <p>No projects available for chat. Create a project first!</p>
          </div>
        )}
      </div>

    </div>
  );
}
