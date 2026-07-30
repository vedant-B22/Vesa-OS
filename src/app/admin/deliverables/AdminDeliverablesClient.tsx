'use client';

import { useState, useTransition } from 'react';
import { deleteDeliverableRecord, createDeliverableRecord } from '../actions';
import { FileCheck, Plus, ArrowRight, ExternalLink, Trash2, AlertCircle, CheckCircle, History, Loader2, Download, Mic } from 'lucide-react';
import { DeliverableStatus } from '@prisma/client';
import { createClient } from '@/lib/supabase/client';

interface AdminDeliverablesClientProps {
  initialDeliverables: any[];
  projects: any[];
}

export default function AdminDeliverablesClient({
  initialDeliverables,
  projects,
}: AdminDeliverablesClientProps) {
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any | null>(null);

  // Modal and feedback states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statusStyles: Record<DeliverableStatus, string> = {
    PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REVISION_REQUESTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  // Handle new deliverable upload & notify client
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const projectId = formData.get('projectId') as string;

    try {
      const res = await createDeliverableRecord(formData);
      if (res.success && res.deliverable) {
        setDeliverables((prev) => [res.deliverable, ...prev]);
        setSuccessMsg(`Successfully uploaded and published "${res.deliverable.name}"`);
        e.currentTarget.reset();

        // Broadcast to client portal in real-time
        try {
          const supabase = createClient();
          const channel = supabase.channel(`project-updates-${projectId}`);
          await channel.send({
            type: 'broadcast',
            event: 'deliverable_created',
            payload: { deliverable: res.deliverable },
          });
        } catch (supabaseErr) {
          console.warn('Real-time broadcast failed:', supabaseErr);
        }
      } else {
        setErrorMsg(res.error || 'Failed to create deliverable.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deliverable deletion
  const handleDelete = (id: string) => {
    setDeleteTargetId(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const target = deliverables.find((d) => d.id === id);
    if (!target) return;

    // Optimistic UI update
    const previousList = [...deliverables];
    setDeliverables((prev) => prev.filter((d) => d.id !== id));

    startTransition(async () => {
      try {
        const res = await deleteDeliverableRecord(id);
        if (res.success) {
          setSuccessMsg(`Successfully deleted deliverable: "${target.name}"`);

          // Broadcast deletion to client portal in real-time
          try {
            const supabase = createClient();
            const channel = supabase.channel(`project-updates-${target.projectId}`);
            await channel.send({
              type: 'broadcast',
              event: 'deliverable_deleted',
              payload: { deliverableId: id },
            });
          } catch (supabaseErr) {
            console.warn('Real-time broadcast failed:', supabaseErr);
          }
        } else {
          // Revert list if failed
          setDeliverables(previousList);
          setErrorMsg(res.error || 'Failed to delete deliverable.');
        }
      } catch (err: any) {
        setDeliverables(previousList);
        setErrorMsg(err.message || 'An error occurred during deletion.');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-geist">Deliverables Control</h1>
        <p className="text-muted text-sm font-inter">Upload creative builds, check approval statuses, and review client revision requests.</p>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-[14px] text-xs text-danger flex items-center gap-2 font-inter">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-success/10 border border-success/20 rounded-[14px] text-xs text-success flex items-center gap-2 font-inter">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Deliverables List Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-geist">Active Deliverables</h2>

          <div className="bg-surface border border-border rounded-[20px] overflow-hidden shadow-xl">
            {deliverables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-inter">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-background/40">
                      <th className="p-4">Deliverable</th>
                      <th className="p-4">Project</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Version</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deliverables.map((item) => (
                      <tr key={item.id} className="hover:bg-card/30 transition-colors text-xs text-slate-200">
                        <td className="p-4">
                          <div>
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            {item.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-xs text-slate-300 font-semibold">{item.project?.name || 'Deleted Project'}</span>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{item.project?.client?.name || 'System'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusStyles[item.status as DeliverableStatus] || ''}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-400">
                          v{item.version}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDeliverable(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-background hover:bg-card border border-border text-slate-400 hover:text-white rounded-[10px] text-[10px] font-semibold transition-colors"
                              title="View Revisions History"
                            >
                              <History className="w-3.5 h-3.5 text-primary" />
                              <span>Revisions ({item.revisionRequests?.length || 0})</span>
                            </button>
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-2 bg-background hover:bg-card border border-border text-slate-400 hover:text-primary rounded-[10px] transition-colors"
                              title="Open Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(item.id)}
                              className="inline-flex p-2 bg-background hover:bg-red-950/20 border border-border hover:border-red-900/30 text-slate-400 hover:text-danger rounded-[10px] transition-colors"
                              title="Delete Deliverable"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500 text-xs font-medium">
                No deliverables uploaded yet. Use the panel on the right to publish one.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Form (1/3 width) */}
        <div>
          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg font-inter">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileCheck className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-geist">Publish Deliverable</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Project</label>
                <select
                  name="projectId"
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client?.name || 'Unknown'})
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
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-100 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Contains styling updates based on brand assets..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-100 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">File or Design URL</label>
                <input
                  name="fileUrl"
                  type="url"
                  required
                  placeholder="https://figma.com/file/... or Vercel link"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-100 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">File Type</label>
                <select
                  name="fileType"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-slate-300 focus:outline-none focus:border-primary transition-colors"
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
                disabled={isUploading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-[14px] transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
              >
                {isUploading ? 'Uploading...' : 'Upload & Notify Client'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-inter">
          <div className="w-full max-w-sm bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center gap-3 text-danger">
              <div className="p-2.5 bg-danger/10 border border-danger/20 rounded-xl">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white font-geist">Delete Deliverable</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this deliverable? This action cannot be undone and will delete associated feedback briefs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 px-4 bg-card hover:bg-surface text-slate-200 text-xs font-semibold rounded-[14px] border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                disabled={isPending}
                className="flex-1 py-2.5 px-4 bg-danger hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-[14px] transition-colors"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisions History Modal */}
      {selectedDeliverable && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-inter">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-white font-geist">Revisions History</h3>
                <p className="text-xs text-slate-500 mt-1">Deliverable: {selectedDeliverable.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliverable(null)}
                className="text-xs text-slate-500 hover:text-slate-350 font-semibold"
              >
                Close
              </button>
            </div>

            {/* Revisions Timeline List */}
            <div className="space-y-6 pt-2">
              {selectedDeliverable.revisionRequests && selectedDeliverable.revisionRequests.length > 0 ? (
                selectedDeliverable.revisionRequests.map((rev: any, idx: number) => {
                  const revisionNumber = selectedDeliverable.revisionRequests.length - idx;
                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-background border border-border rounded-[20px] space-y-4 hover:border-border/80 transition-colors"
                    >
                      {/* Header metadata */}
                      <div className="flex justify-between items-start border-b border-border/40 pb-2.5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white">Revision #{revisionNumber}</span>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <span>Sent by client organization</span>
                            <span className="font-semibold text-slate-400">"{selectedDeliverable.project?.client?.name || 'System'}"</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-550">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Content block */}
                      <div className="space-y-3.5">
                        {/* Audio voice Note player */}
                        {rev.audioUrl ? (
                          <div className="space-y-2 bg-card/40 border border-border p-3.5 rounded-[14px]">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5 text-danger animate-pulse" />
                                Voice Feedback Note ({rev.duration ? `${rev.duration}s` : 'audio'})
                              </span>
                              <a
                                href={rev.audioUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download Audio
                              </a>
                            </div>
                            <audio src={rev.audioUrl} controls className="w-full mt-1.5" />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Written Feedback</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                              {rev.feedbackRaw}
                            </p>
                          </div>
                        )}

                        {/* Transcript */}
                        {rev.transcription && (
                          <div className="space-y-1 bg-background/50 border border-border p-3 rounded-lg text-xs">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Verbatim Transcript</span>
                            <p className="text-slate-300 leading-relaxed italic">"{rev.transcription}"</p>
                          </div>
                        )}

                        {/* AI Summary */}
                        {rev.aiSummary && (
                          <div className="space-y-1 bg-background/50 border border-border p-3 rounded-lg text-xs">
                            <span className="text-[9px] uppercase font-bold text-slate-500">AI Summary</span>
                            <p className="text-slate-300 leading-relaxed">{rev.aiSummary}</p>
                          </div>
                        )}

                        {/* Clarification answers */}
                        {rev.clarification && Object.keys(rev.clarification).length > 0 && (
                          <div className="space-y-2.5 bg-background/50 border border-border p-3 rounded-lg text-xs">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Clarification Answers</span>
                            <div className="space-y-2">
                              {Object.entries(rev.clarification).map(([q, a]) => (
                                <div key={q} className="border-l-2 border-primary/50 pl-2">
                                  <span className="text-[10px] text-slate-400 block font-semibold leading-relaxed">{q}</span>
                                  <span className="text-slate-200 text-xs block font-medium mt-0.5">{String(a)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs font-semibold">
                  No revision requests have been submitted for this deliverable yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
