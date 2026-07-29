'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Mic, 
  FileText, 
  FileCode, 
  Globe, 
  Megaphone,
  Play, 
  Square, 
  Pause, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Plus,
  Send,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface AIWorkspaceClientProps {
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}

export function AIWorkspaceClient({ projects, clients }: AIWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'voicenotes' | 'proposal' | 'analyzer' | 'brand' | 'code' | 'image'>('chat');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  /* --- AI CHAT MODULE STATE --- */
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'system'; text: string }>>([
    { sender: 'system', text: 'Hello! I am your VESA OS Business Intelligence partner. Ask me to draft proposals, analyze client comments, extract tasks, or generate scripts.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsChatLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let systemReply = 'I have processed your query. Let me know if you would like me to link this analysis directly to a client workspace project.';
      if (userText.toLowerCase().includes('proposal') || userText.toLowerCase().includes('contract')) {
        systemReply = 'Here is a contract proposal template you can generate:\n\n**Scope of Work**: Website UX Rebranding\n**Timeline**: 4 Weeks\n**Milestones**: Wireframes, High-Fidelity UI, Asset Delivery, and Launch.';
      } else if (userText.toLowerCase().includes('audit') || userText.toLowerCase().includes('analyze')) {
        systemReply = 'Audit results finalized:\n- Loading Speeds: Optimizable (-1.2s potential)\n- Copy Tone: Modern, authoritative\n- Mobile responsiveness looks sound. Suggest minor improvements to mobile navigation padding.';
      }
      setChatMessages(prev => [...prev, { sender: 'system', text: systemReply }]);
      setIsChatLoading(false);
    }, 1000);
  };

  /* --- AUDIO RECORDER MODULE STATE --- */
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [voiceNoteTitle, setVoiceNoteTitle] = useState('Voice Feedback Brief');
  const [selectedLinkProject, setSelectedLinkProject] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);
  const [audioSummary, setAudioSummary] = useState<string | null>(null);
  const [audioTasks, setAudioTasks] = useState<string[]>([]);
  const [audioMime, setAudioMime] = useState('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Waveform visualization drawer
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4F8CFF'; // Primary Accent
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      // Initialize AnalyserNode for audio visualization
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Handle stop trigger
        setIsProcessingAudio(true);
        setTimeout(() => {
          setAudioTranscript('"Make the primary buttons slightly larger with rounded borders of 14px, matching Apple\'s design principles, and update the tagline to focus on scalable database structures."');
          setAudioSummary('Client requested UI modifications to match premium styling guidelines, focusing on button borders and tagline enhancements.');
          setAudioTasks(['Increase primary buttons border-radius to 14px', 'Redraft landing tagline for scalable databases']);
          setIsProcessingAudio(false);
        }, 1500);

        stream.getTracks().forEach(track => track.stop());
        if (audioCtx.state !== 'closed') audioCtx.close();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);

      // Start visualizer and timer
      drawWaveform();
      timerIntervalRef.current = setInterval(() => {
        setRecordTime(t => t + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record voice notes.');
    }
  };

  // Pause / Resume Recorder
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Restart timer
      timerIntervalRef.current = setInterval(() => {
        setRecordTime(t => t + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Stop Recorder
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* --- PROPOSAL WRITER STATE --- */
  const [proposalOutput, setProposalOutput] = useState<string | null>(null);
  const [isProposalLoading, setIsProposalLoading] = useState(false);
  const handleGenerateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProposalLoading(true);
    setTimeout(() => {
      setProposalOutput(`**BUSINESS PROPOSAL FOR VESA OS SERVICE DESIGN**
- **Objective**: Craft a unified design structure matching linear Apple aesthetics.
- **Milestones & Deliverables**:
  1. Figma Asset Design System Sync (Week 1)
  2. Front-End Tailwind v4 Theme Construction (Week 2)
  3. Interactive Dashboard Page Code Verification (Week 3)
  4. Launch & Operations Handover (Week 4)
- **Total Compensation Fee**: $15,000 USD`);
      setIsProposalLoading(false);
    }, 1200);
  };

  /* --- WEBSITE ANALYZER STATE --- */
  const [analyzerOutput, setAnalyzerOutput] = useState<string | null>(null);
  const [isAnalyzerLoading, setIsAnalyzerLoading] = useState(false);
  const handleAnalyzeWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzerLoading(true);
    setTimeout(() => {
      setAnalyzerOutput(`**VESA AUDIT SYSTEMS SUMMARY REPORT**
- **Core Performance**: LCP 1.8s (Fast). Suggest caching visual files.
- **Aesthetic Assessment**: Premium Midnight Graphite theme matches industry leaders.
- **Conversion Check**: Primary checkout action has low contrast. Update button to #4F8CFF.`);
      setIsAnalyzerLoading(false);
    }, 1200);
  };

  /* --- BRAND ASSISTANT STATE --- */
  const [brandOutput, setBrandOutput] = useState<string | null>(null);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const handleGenerateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBrandLoading(true);
    setTimeout(() => {
      setBrandOutput(`**BRAND TAGLINE SUGGESTIONS**
- "SaaS Operations, Simplified." (High authority)
- "Design with speed, deploy with certainty." (Action-oriented)
- "The design-driven engine for modern business workspaces." (Linear/Apple focus)`);
      setIsBrandLoading(false);
    }, 1000);
  };

  /* --- CODE ASSISTANT STATE --- */
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCodeLoading(true);
    setTimeout(() => {
      setCodeOutput(`// Reusable premium card component with glassmorphism hover transitions
import React from 'react';

export function PremiumRedesignCard({ title, children }) {
  return (
    <div className="bg-surface hover:bg-card border border-border hover:border-primary/20 rounded-[20px] p-5 transition-all duration-200 shadow-md">
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <div className="text-xs text-muted leading-relaxed">{children}</div>
    </div>
  );
}`);
      setIsCodeLoading(false);
    }, 1100);
  };

  /* --- IMAGE GENERATION STATE --- */
  const [imageOutput, setImageOutput] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const handleGenerateImage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsImageLoading(true);
    setTimeout(() => {
      setImageOutput('/placeholder-dashboard.png'); // Mocks a mockup preview
      setIsImageLoading(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[75vh]">
      
      {/* Left Sidebar: Sub-Modules Navigation Tabs (1/4 width) */}
      <div className="bg-surface border border-border p-4 rounded-[20px] space-y-1.5 h-fit shadow-md">
        <div className="px-3.5 py-2 text-[10px] uppercase font-bold text-muted">AI Workspace Tools</div>
        
        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'chat' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>Interactive Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('voicenotes')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'voicenotes' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <Mic className="w-4 h-4 shrink-0" />
          <span>Voice Recording & Memo</span>
        </button>

        <button
          onClick={() => setActiveTab('proposal')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'proposal' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Proposal Writer</span>
        </button>

        <button
          onClick={() => setActiveTab('analyzer')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'analyzer' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>Website Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'brand' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>Brand Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'code' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <FileCode className="w-4 h-4 shrink-0" />
          <span>Code Sandbox Tool</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-xs font-semibold transition-all ${
            activeTab === 'image' ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-card'
          }`}
        >
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span>Image Generator</span>
        </button>
      </div>

      {/* Right Column: Console Details Workspace (3/4 width) */}
      <div className="lg:col-span-3 bg-surface border border-border p-6 rounded-[20px] shadow-lg flex flex-col justify-between min-h-[60vh] relative">
        
        {/* Tab 1: AI Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">BI Chat Assistant</h3>
              </div>

              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-[16px] max-w-xl text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-white ml-auto shadow-md shadow-primary/10' 
                        : 'bg-card border border-border text-slate-300 mr-auto whitespace-pre-wrap shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="p-4 bg-card border border-border rounded-[16px] max-w-sm mr-auto flex items-center gap-2 text-xs text-muted shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Processing response...</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2.5 bg-background p-2 border border-border rounded-[16px]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your assistant anything... (e.g. Draft branding tagline)"
                className="w-full bg-transparent text-xs text-foreground px-2 outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-primary hover:bg-blue-500 text-white p-2 rounded-[12px] transition-colors shrink-0 disabled:opacity-55"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Voice Notes Recorder & Memo */}
        {activeTab === 'voicenotes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Interactive Audio Recorder</h3>
              </div>
              <span className="text-[10px] text-muted">Supports real-time transcript audits</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recorder Controls Column */}
              <div className="space-y-5">
                <div className="bg-card border border-border p-5 rounded-[20px] space-y-4 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="text-2xl font-mono font-bold text-foreground">
                      {isRecording ? formatTime(recordTime) : '00:00'}
                    </span>
                  </div>

                  {/* Waveform Canvas */}
                  <div className="w-full h-14 bg-background border border-border rounded-[14px] overflow-hidden relative flex items-center justify-center">
                    {!isRecording && <span className="text-[10px] text-muted font-semibold uppercase">Microphone Idle</span>}
                    <canvas 
                      ref={canvasRef} 
                      width="350" 
                      height="56" 
                      className={`w-full h-full ${isRecording && !isPaused ? 'block' : 'hidden'}`} 
                    />
                    {isRecording && isPaused && <span className="text-[10px] text-warning font-bold uppercase">Recording Paused</span>}
                  </div>

                  {/* Record Control Buttons */}
                  <div className="flex justify-center items-center gap-3">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[14px] transition-all shadow-md shadow-primary/10"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Record</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={togglePause}
                          className="p-3 bg-card border border-border rounded-full hover:bg-slate-800 text-muted hover:text-foreground transition-all"
                          title={isPaused ? 'Resume' : 'Pause'}
                        >
                          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-danger hover:bg-red-400 text-white text-xs font-semibold rounded-[14px] transition-all shadow-md shadow-danger/10"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop & Sync</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Linking parameters card */}
                <div className="bg-card border border-border p-5 rounded-[20px] space-y-3.5">
                  <span className="text-[10px] uppercase font-bold text-muted block border-b border-border pb-1">Context Linking</span>
                  
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Associate Project</label>
                    <select
                      value={selectedLinkProject}
                      onChange={(e) => setSelectedLinkProject(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-[10px] text-xs text-slate-300 outline-none"
                    >
                      <option value="">-- No Project linkage --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Voice note Title</label>
                    <input
                      type="text"
                      value={voiceNoteTitle}
                      onChange={(e) => setVoiceNoteTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-[10px] text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transcription & Summary Output Column */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Analysis Results</h4>

                {isProcessingAudio ? (
                  <div className="p-8 bg-card border border-border rounded-[20px] flex flex-col items-center justify-center text-center space-y-3 shadow-md">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Processing Audio Stream...</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Performing transcription and extracting tasks.</p>
                    </div>
                  </div>
                ) : audioTranscript ? (
                  <div className="space-y-4">
                    {/* Transcript card */}
                    <div className="bg-card border border-border p-4 rounded-[20px] space-y-2 relative shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-muted">Speech-To-Text Output</span>
                        <button
                          onClick={() => handleCopy(audioTranscript, 'trans')}
                          className="text-muted hover:text-foreground p-1 rounded hover:bg-slate-800 transition-colors"
                          title="Copy Transcript"
                        >
                          {copiedTextId === 'trans' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">{audioTranscript}</p>
                    </div>

                    {/* Summary card */}
                    <div className="bg-card border border-border p-4 rounded-[20px] space-y-3.5 shadow-md">
                      <div className="space-y-1 border-b border-border pb-2">
                        <span className="text-[9px] uppercase font-bold text-muted block">AI Summary Brief</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{audioSummary}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold text-muted block">Extracted tasks</span>
                        <ul className="space-y-1.5">
                          {audioTasks.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Record a memo brief to view transcriptions.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Proposal Writer */}
        {activeTab === 'proposal' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Proposal Writer</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleGenerateProposal} className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Target Client</label>
                  <select className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-300 outline-none">
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Project Objective</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website development & launch"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Initial Price Fee ($)</label>
                  <input
                    type="number"
                    defaultValue={5000}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProposalLoading}
                  className="w-full py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[12px] shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {isProposalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate proposal</span>
                </button>
              </form>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Draft Output</span>
                {isProposalLoading ? (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs animate-pulse shadow-inner">
                    Drafting scope document...
                  </div>
                ) : proposalOutput ? (
                  <div className="p-5 bg-card border border-border rounded-[20px] relative shadow-md">
                    <button
                      onClick={() => handleCopy(proposalOutput, 'prop')}
                      className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 text-muted hover:text-foreground rounded transition-colors"
                      title="Copy draft"
                    >
                      {copiedTextId === 'prop' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{proposalOutput}</pre>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Submit the form parameters on the left to write a draft proposal.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Website Analyzer */}
        {activeTab === 'analyzer' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Website Auditor</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleAnalyzeWebsite} className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Target Link URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://client-landing.com"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzerLoading}
                  className="w-full py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[12px] shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {isAnalyzerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>Audit Website</span>
                </button>
              </form>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Audit Logs Output</span>
                {isAnalyzerLoading ? (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs animate-pulse shadow-inner">
                    Analyzing target URL performance...
                  </div>
                ) : analyzerOutput ? (
                  <div className="p-5 bg-card border border-border rounded-[20px] relative shadow-md">
                    <button
                      onClick={() => handleCopy(analyzerOutput, 'url')}
                      className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 text-muted hover:text-foreground rounded transition-colors"
                      title="Copy logs"
                    >
                      {copiedTextId === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{analyzerOutput}</pre>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Submit a link to perform automated copy audits and loading speed reports.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Brand Assistant */}
        {activeTab === 'brand' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Megaphone className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Brand Assistant</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleGenerateBrand} className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Company Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. A serverless database integration layer for Next.js applications"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBrandLoading}
                  className="w-full py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[12px] shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {isBrandLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate taglines</span>
                </button>
              </form>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Tagline Ideas</span>
                {isBrandLoading ? (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs animate-pulse shadow-inner">
                    Drafting copy taglines...
                  </div>
                ) : brandOutput ? (
                  <div className="p-5 bg-card border border-border rounded-[20px] relative shadow-md">
                    <button
                      onClick={() => handleCopy(brandOutput, 'brand')}
                      className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 text-muted hover:text-foreground rounded transition-colors"
                      title="Copy options"
                    >
                      {copiedTextId === 'brand' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{brandOutput}</pre>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Add client description details to draft marketing slogans.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Code Assistant */}
        {activeTab === 'code' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileCode className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Code Assistant</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleGenerateCode} className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Component Goal</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Card component with glass hover effect"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCodeLoading}
                  className="w-full py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[12px] shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {isCodeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>Generate code</span>
                </button>
              </form>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Generated Script</span>
                {isCodeLoading ? (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs animate-pulse shadow-inner">
                    Writing component script...
                  </div>
                ) : codeOutput ? (
                  <div className="p-5 bg-slate-950 border border-border rounded-[20px] relative font-mono shadow-md overflow-x-auto">
                    <button
                      onClick={() => handleCopy(codeOutput, 'code')}
                      className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 text-muted hover:text-foreground rounded transition-colors"
                      title="Copy code"
                    >
                      {copiedTextId === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-[11px] text-emerald-400 whitespace-pre leading-relaxed">{codeOutput}</pre>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Enter details to write visual React code modules.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Image Generator */}
        {activeTab === 'image' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <ImageIcon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Design Mockup Generator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <form onSubmit={handleGenerateImage} className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Image Prompt Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern landing dashboard preview, blue gradients"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[12px] text-xs text-slate-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImageLoading}
                  className="w-full py-2.5 bg-primary hover:bg-blue-500 text-white text-xs font-semibold rounded-[12px] shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  {isImageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>Generate image</span>
                </button>
              </form>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Image Output</span>
                {isImageLoading ? (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs animate-pulse shadow-inner">
                    Generating graphical mockups...
                  </div>
                ) : imageOutput ? (
                  <div className="bg-card border border-border p-3 rounded-[20px] flex items-center justify-center shadow-md">
                    {/* Render a beautiful graphic asset representing the prompt */}
                    <div className="w-full h-44 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-[14px] border border-border flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                      <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      <span className="absolute bottom-3 left-3 text-[9px] uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 border border-border rounded font-bold text-slate-400">Design asset Mockup</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 bg-card border border-border rounded-[20px] text-center text-slate-500 text-xs shadow-inner">
                    Submit prompts to generate design draft elements.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
