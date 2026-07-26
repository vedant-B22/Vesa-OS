import { createDeliverableRecord, getProjects } from '../actions';
import { prisma } from '@/lib/db';
import { FileCheck, Plus, ArrowRight, ExternalLink } from 'lucide-react';
import { DeliverableStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminDeliverablesPage() {
  const [projects, deliverables] = await Promise.all([
    getProjects(),
    prisma.deliverable.findMany({
      include: {
        project: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const statusStyles: Record<DeliverableStatus, string> = {
    PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REVISION_REQUESTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Deliverables Control</h1>
        <p className="text-slate-400 text-sm">Upload creative builds, check approval statuses, and review client revision requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Deliverables List Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-medium">Active Deliverables</h2>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {deliverables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-xs font-semibold text-slate-500 bg-slate-950/40">
                      <th className="p-4">Deliverable</th>
                      <th className="p-4">Project</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Version</th>
                      <th className="p-4 text-right">View Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {deliverables.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/10 transition-colors text-sm text-slate-200">
                        <td className="p-4">
                          <div>
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            {item.description && <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold">{item.project.name}</span>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{item.project.client.name}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusStyles[item.status]}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-400">
                          v{item.version}
                        </td>
                        <td className="p-4 text-right">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500">
                No deliverables uploaded yet. Use the panel on the right to publish one.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Publish Deliverable</h2>
            </div>

            <form action={async (formData) => {
              'use server';
              await createDeliverableRecord(formData);
            }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Project</label>
                <select
                  name="projectId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Deliverable Title</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Homepage Figma V1"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Contains styling updates based on brand assets..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">File or Design URL</label>
                <input
                  name="fileUrl"
                  type="url"
                  required
                  placeholder="https://figma.com/file/... or Vercel link"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">File Type</label>
                <select
                  name="fileType"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="figma">Figma Design</option>
                  <option value="vercel">Web Build / Vercel Preview</option>
                  <option value="pdf">Document / PDF</option>
                  <option value="video">MP4 Video Demo</option>
                  <option value="other">Other Link</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2"
              >
                Upload & Notify Client
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
