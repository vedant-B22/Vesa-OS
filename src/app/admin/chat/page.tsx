import { getProjects } from '../actions';
import AdminChatClient from './AdminChatClient';

export const dynamic = 'force-dynamic';

export default async function AdminChatPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Team & Client Chat</h1>
        <p className="text-slate-400 text-sm">Select a project below to chat in real-time with clients and team members.</p>
      </div>

      <AdminChatClient projects={projects} />
    </div>
  );
}
