'use client';

import { useState, useTransition } from 'react';
import Chat from '@/components/shared/Chat';
import FileManager from '@/components/shared/FileManager';
import {
  approveClientDeliverable,
  analyzeRawFeedbackAction,
  submitStructuredRevisionAction,
  uploadClientVoiceNoteAction,
} from './actions';
import {
  FolderKanban,
  FileCheck,
  Video,
  ExternalLink,
  Mic,
  CheckCircle,
  HelpCircle,
  FileAudio,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  Upload,
  Loader2,
} from 'lucide-react';

interface ClientWorkspaceProps {
  initialProjects: any[];
  initialMeetings: any[];
  clientName: string;
}

export default function ClientWorkspace({
  initialProjects,
  initialMeetings,
  clientName,
}: ClientWorkspaceProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjects[0]?.id || ''
  );

  const [isPending, startTransition] = useTransition();

  // AI Revision Dialog State
  const [activeDeliverableId, setActiveDeliverableId] = useState<string | null>(null);
  const [rawFeedback, setRawFeedback] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [selectedStyle, setSelectedStyle] = useState('Modern');
  const [revisionPriority, setRevisionPriority] = useState('MEDIUM');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Audio Upload State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [voiceNoteResult, setVoiceNoteResult] = useState<any | null>(null);
  const [voiceNoteError, setVoiceNoteError] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // View Tab state (Deliverables vs Chat)
  const [activeTab, setActiveTab] = useState<'deliverables' | 'chat'>('deliverables');

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Approve Deliverable Handler
  const handleApprove = (deliverableId: string) => {
    startTransition(async () => {
      const res = await approveClientDeliverable(deliverableId);
      if (res.success) {
        // Optimistic state update
        setProjects((prev) =>
          prev.map((proj) => ({
            ...proj,
            deliverables: proj.deliverables.map((del: any) =>
              del.id === deliverableId ? { ...del, status: 'APPROVED' } : del
            ),
          }))
        );
      }
    });
  };

  // Start AI Analysis of raw feedback
  const handleAnalyzeFeedback = async () => {
    if (!rawFeedback.trim() || !activeDeliverableId) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      console.log("Form submit: Requesting AI feedback analysis...");
      console.log("Before API request: analyzeRawFeedbackAction", { activeDeliverableId, rawFeedbackLength: rawFeedback.length });
      const res = await analyzeRawFeedbackAction(activeDeliverableId, rawFeedback);
      console.log("After API response: analyzeRawFeedbackAction result:", res);

      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
        setSelectedStyle(res.analysis.suggestedStyle || 'Modern');
        // Pre-fill answer state
        const answers: Record<string, string> = {};
        res.analysis.questions.forEach((q: string) => {
          answers[q] = '';
        });
        setQuestionAnswers(answers);
      } else if (res.error) {
        console.warn("API returned error response:", res.error);
        setAiError(res.error);
      }
    } catch (err: any) {
      console.error("Inside catch block: analyzeFeedback failed", err);
      setAiError(err.message || 'An unexpected error occurred during AI analysis.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit final structured revision brief
  const handleSubmitRevision = () => {
    if (!activeDeliverableId || !aiAnalysis) return;
    setAiError(null);
    startTransition(async () => {
      try {
        console.log("Form submit: Submitting structured revision brief...");
        console.log("Before API request: submitStructuredRevisionAction");
        const res = await submitStructuredRevisionAction(
          activeDeliverableId,
          rawFeedback,
          aiAnalysis,
          questionAnswers
        );
        console.log("After API response: submitStructuredRevisionAction result:", res);

        if (res.success) {
          // Update local state
          setProjects((prev) =>
            prev.map((proj) => ({
              ...proj,
              deliverables: proj.deliverables.map((del: any) =>
                del.id === activeDeliverableId
                  ? { ...del, status: 'REVISION_REQUESTED' }
                  : del
              ),
            }))
          );
          // Reset states
          setActiveDeliverableId(null);
          setRawFeedback('');
          setAiAnalysis(null);
          setQuestionAnswers({});
        } else if (res.error) {
          console.warn("API returned error response:", res.error);
          setAiError(res.error);
        }
      } catch (err: any) {
        console.error("Inside catch block: submitRevision failed", err);
        setAiError(err.message || 'An unexpected error occurred during submission.');
      }
    });
  };

  // Process and upload Voice Note
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;

    setAudioFile(file);
    setIsAudioUploading(true);
    setVoiceNoteResult(null);
    setVoiceNoteError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        console.log("Form submit: Uploading audio voice note...");
        console.log("Before API request: uploadClientVoiceNoteAction", { selectedProjectId, mimeType: file.type });
        const res = await uploadClientVoiceNoteAction(
          selectedProjectId,
          base64String,
          file.type
        );
        console.log("After API response: uploadClientVoiceNoteAction result:", res);

        if (res.success && res.voiceNote) {
          setVoiceNoteResult(res.voiceNote);
        } else if (res.error) {
          console.warn("API returned error response:", res.error);
          setVoiceNoteError(res.error);
        }
      } catch (err: any) {
        console.error("Inside catch block: handleAudioUpload failed", err);
        setVoiceNoteError(err.message || 'An unexpected error occurred during audio processing.');
      } finally {
        setIsAudioUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Audio Recording via browser MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });

        setAudioFile(file);
        setIsAudioUploading(true);
        setVoiceNoteResult(null);
        setVoiceNoteError(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          try {
            console.log("Form submit: Processing recorded audio...");
            console.log("Before API request: uploadClientVoiceNoteAction", { selectedProjectId, mimeType: 'audio/webm' });
            const res = await uploadClientVoiceNoteAction(
              selectedProjectId,
              base64String,
              'audio/webm'
            );
            console.log("After API response: uploadClientVoiceNoteAction result:", res);

            if (res.success && res.voiceNote) {
              setVoiceNoteResult(res.voiceNote);
            } else if (res.error) {
              console.warn("API returned error response:", res.error);
              setVoiceNoteError(res.error);
            }
          } catch (err: any) {
            console.error("Inside catch block: stopRecording failed", err);
            setVoiceNoteError(err.message || 'An unexpected error occurred during recording processing.');
          } finally {
            setIsAudioUploading(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Terminate microphone tracks to release permissions
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in text-slate-100">
      
      {/* Col 1: Projects Sidebar Selector */}
      <div className="lg:col-span-1 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Projects Workspaces
        </h2>
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setVoiceNoteResult(null);
                setAudioFile(null);
              }}
              className={`w-full p-4 rounded-[20px] text-left border transition-all duration-200 ${
                selectedProjectId === project.id
                  ? 'bg-card border-primary shadow-lg shadow-primary/5'
                  : 'bg-surface border-border hover:border-border/80'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {project.progress}%
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 truncate">
                {project.name}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* Col 2 & 3: Active Project Workspace (Main View) */}
      <div className="lg:col-span-2 space-y-6">
        {activeProject ? (
          <>
            {/* Active Project Title & Progress */}
            <div className="p-6 bg-surface border border-border rounded-[20px] space-y-4 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-white">{activeProject.name}</h1>
                  <p className="text-xs text-slate-400 mt-1">{activeProject.description}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-[var(--client-secondary)]/10 text-[var(--client-secondary)] border border-[var(--client-secondary)]/20">
                  {activeProject.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Build Progress</span>
                  <span className="font-semibold text-slate-300">{activeProject.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900/50">
                  <div
                    className="h-full bg-[var(--client-secondary)] rounded-full transition-all duration-300"
                    style={{ width: `${activeProject.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 gap-1 bg-background border border-border rounded-[14px] mb-4">
              <button
                onClick={() => setActiveTab('deliverables')}
                type="button"
                className={`py-2 text-xs font-semibold rounded-[10px] transition-all duration-150 ${
                  activeTab === 'deliverables'
                    ? 'bg-card text-white shadow-sm border border-border font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Deliverables
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                type="button"
                className={`py-2 text-xs font-semibold rounded-[10px] transition-all duration-150 ${
                  activeTab === 'chat'
                    ? 'bg-card text-white shadow-sm border border-border font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Project Chat
              </button>
            </div>

            {/* Conditional Tab Rendering */}
            {activeTab === 'deliverables' ? (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deliverables Approval Center
                </h2>

                <div className="space-y-3">
                  {activeProject.deliverables.length > 0 ? (
                    activeProject.deliverables.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-5 bg-surface border border-border rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-200">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-450 font-semibold bg-background border border-border px-1.5 py-0.5 rounded-[6px]">
                              v{item.version}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted line-clamp-1">{item.description}</p>
                          )}
                        </div>

                        {/* Approval Controls */}
                        <div className="flex items-center gap-2.5">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-background hover:bg-card border border-border text-xs font-semibold text-foreground rounded-[14px] transition-all"
                          >
                            Preview Build
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {item.status === 'PENDING_REVIEW' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setActiveDeliverableId(item.id)}
                                className="px-3 py-2 bg-card hover:bg-surface border border-border text-xs font-semibold text-foreground rounded-[14px] transition-all"
                              >
                                Request Revision
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(item.id)}
                                disabled={isPending}
                                className="px-3.5 py-2 bg-primary hover:bg-blue-500 text-white text-xs font-bold rounded-[14px] transition-all shadow-md shadow-primary/10"
                              >
                                Approve
                              </button>
                            </>
                          )}

                          {item.status === 'APPROVED' && (
                            <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-950/20 border border-green-900/30 px-3 py-1.5 rounded-xl">
                              <CheckCircle className="w-4 h-4" />
                              Approved
                            </div>
                          )}

                          {item.status === 'REVISION_REQUESTED' && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-950/20 border border-amber-900/30 px-3 py-1.5 rounded-xl">
                              <Clock className="w-4 h-4" />
                              Revision Pending
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                      No deliverables published for review yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Chat
                projectId={activeProject.id}
                projectName={activeProject.name}
                currentUserRole="CLIENT"
              />
            )}
          </>
        ) : (
          <div className="p-16 bg-slate-900/20 border border-slate-900 rounded-3xl text-center text-slate-500 text-sm">
            No active project workspaces found.
          </div>
        )}
      </div>

      {/* Col 4: Meetings Calendar & AI Voice Notes Uploader */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Voice Note Uploader */}
        {selectedProjectId && (
          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <Mic className="w-4 h-4 text-[var(--client-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Voice Note Feedback
              </h2>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Upload an audio voice note to transcribe revision items, summarize tasks, and set priorities automatically.
            </p>

            {voiceNoteError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">Voice Note Processing Failed</span>
                  {voiceNoteError}
                </div>
              </div>
            )}

            {isAudioUploading ? (
              <div className="p-8 bg-card border border-border rounded-[14px] flex flex-col items-center justify-center text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs text-foreground font-semibold">AI Transcribing...</span>
                <span className="text-[10px] text-muted">Extracting action sprint tasks</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative border border-dashed border-border bg-background hover:bg-card rounded-[14px] p-6 transition-all flex flex-col items-center justify-center cursor-pointer group">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-xs text-foreground font-semibold">Upload Audio File</span>
                  <span className="text-[10px] text-muted mt-1">Drag and drop or browse files</span>
                </div>

                <div className="flex gap-2">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-full py-2.5 bg-danger hover:bg-red-500 text-white text-xs font-bold rounded-[14px] flex items-center justify-center gap-1.5 animate-pulse shadow-md transition-colors"
                    >
                      <span className="w-2 h-2 bg-white rounded-full" />
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-full py-2.5 bg-background hover:bg-card border border-border text-muted hover:text-foreground text-xs font-bold rounded-[14px] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Mic className="w-3.5 h-3.5 text-danger shrink-0" />
                      Record Live Note
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Display Voice Note Transcription Results */}
            {voiceNoteResult && (
              <div className="p-3.5 bg-background border border-border rounded-[14px] space-y-2.5 max-h-64 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Priority: {voiceNoteResult.priority}
                  </span>
                  <span className="text-[8px] text-slate-500">AI Success</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Summary</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {voiceNoteResult.summary}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Tasks</span>
                  <ul className="list-disc pl-3 text-[9px] text-slate-400 space-y-1">
                    {voiceNoteResult.tasks?.map((task: string, idx: number) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedProjectId && (
          <FileManager
            projectId={selectedProjectId}
            currentUserRole="CLIENT"
          />
        )}

        {/* Meetings Summary Card */}
        <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Video className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Upcoming Syncs
            </h2>
          </div>

          <div className="space-y-3.5">
            {meetings.length > 0 ? (
              meetings.map((meeting) => (
                <div className="flex gap-3.5 items-start pb-4 border-b border-border last:pb-0 last:border-b-0">
                  <div className="p-2 bg-background border border-border text-muted rounded-[10px] flex-shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{meeting.title}</h4>
                    <p className="text-[9px] text-slate-500 font-medium">
                      {new Date(meeting.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {meeting.googleMeetLink && (
                      <a
                        href={meeting.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[9px] text-[var(--client-secondary)] hover:underline mt-0.5"
                      >
                        Join Google Meet
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-600 text-xs">
                No scheduled syncs.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI REVISION MODAL / WIZARD OVERLAY */}
      {activeDeliverableId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-tr from-amber-600 to-orange-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">AI Feedback Assistant</h3>
              </div>
              <button
                onClick={() => {
                  setActiveDeliverableId(null);
                  setRawFeedback('');
                  setAiAnalysis(null);
                  setQuestionAnswers({});
                  setAiError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
              >
                Cancel
              </button>
            </div>

            {aiError && (
              <div className="p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">AI Analysis Failed</span>
                  {aiError}
                </div>
              </div>
            )}

            {/* Step 1: Input raw feedback */}
            {!aiAnalysis ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400">
                    What adjustments are needed?
                  </label>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Write your raw notes or complaints in your own words. The AI will parse it and formulate structured questions.
                  </p>
                </div>

                <textarea
                  value={rawFeedback}
                  onChange={(e) => setRawFeedback(e.target.value)}
                  rows={4}
                  placeholder="e.g. The color scheme feels too corporate, I want a luxury Apple-like style. Also make the icons larger."
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors resize-none"
                />

                <button
                  onClick={handleAnalyzeFeedback}
                  disabled={isAiLoading || !rawFeedback.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Feedback...
                    </>
                  ) : (
                    <>
                      Analyze & Generate Wizard
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Step 2: Answer AI-Generated follow-up questions */
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-1">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Summary of requests</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{aiAnalysis.summary}</p>
                </div>

                {/* AI Follow up Questions */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Follow-Up Questionnaire
                  </span>

                  {aiAnalysis.questions.map((q: string, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-300 leading-relaxed">
                        {q}
                      </label>
                      <input
                        type="text"
                        value={questionAnswers[q] || ''}
                        onChange={(e) =>
                          setQuestionAnswers((prev) => ({
                            ...prev,
                            [q]: e.target.value,
                          }))
                        }
                        placeholder="Your answer..."
                        className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {/* Style and Priority settings */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                      Preferred Style
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80"
                    >
                      <option value="Luxury">Luxury</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Minimal">Minimal</option>
                      <option value="Apple">Apple</option>
                      <option value="Modern">Modern</option>
                      <option value="Creative">Creative</option>
                      <option value="Technology">Technology</option>
                      <option value="Bold">Bold</option>
                      <option value="Elegant">Elegant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                      Revision Priority
                    </label>
                    <select
                      value={revisionPriority}
                      onChange={(e) => setRevisionPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Target Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setAiAnalysis(null)}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/50 transition-colors"
                  >
                    Adjust Raw Notes
                  </button>
                  <button
                    onClick={handleSubmitRevision}
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {isPending ? 'Publishing...' : 'Submit Revision Brief'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
