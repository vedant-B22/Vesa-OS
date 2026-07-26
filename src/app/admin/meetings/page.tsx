import { getMeetings, createMeetingRecord, deleteMeetingRecord, getClients, getProjects } from '../actions';
import { Video, Plus, Clock, Trash2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminMeetingsPage() {
  const [meetings, clients, projects] = await Promise.all([
    getMeetings(),
    getClients(),
    getProjects(),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Meetings Planner</h1>
        <p className="text-slate-400 text-sm">Schedule design reviews, align sync calls, and generate Google Meet invite links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Meetings List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-medium">All Syncs & Reviews</h2>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-5 shadow-xl">
            {meetings.length > 0 ? (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-4 bg-slate-950 border border-slate-900/80 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex-shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {meeting.client.name}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-200 truncate">{meeting.title}</h3>
                        {meeting.description && <p className="text-xs text-slate-400 line-clamp-1">{meeting.description}</p>}
                        
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(meeting.scheduledAt).toLocaleDateString()} at{' '}
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {meeting.googleMeetLink && (
                        <a
                          href={meeting.googleMeetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                        >
                          Join Meet
                        </a>
                      )}
                      
                      <form action={deleteMeetingRecord.bind(null, meeting.id)}>
                        <button
                          type="submit"
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Cancel Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">
                No sync calls scheduled yet. Schedule one on the right side panel!
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Schedule Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <Video className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Schedule Call</h2>
            </div>

            <form action={async (formData) => {
              'use server';
              await createMeetingRecord(formData);
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
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Project (Optional)</label>
                <select
                  name="projectId"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="">-- No Specific Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Meeting Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Design Alignment Sync"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Agenda / Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Aligning on typography and color options..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Schedule Date & Time</label>
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Google Meet Link (Optional)</label>
                <input
                  name="googleMeetLink"
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2"
              >
                Schedule Sync Link
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
