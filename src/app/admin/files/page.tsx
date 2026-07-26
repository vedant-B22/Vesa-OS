import { getProjects } from '../actions';
import AdminFilesClient from './AdminFilesClient';

export const dynamic = 'force-dynamic';

export default async function AdminFilesPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Workspace File Manager</h1>
        <p className="text-slate-400 text-sm">Select a client project to manage, upload, and inspect shared files.</p>
      </div>

      <AdminFilesClient projects={projects} />
    </div>
  );
}
