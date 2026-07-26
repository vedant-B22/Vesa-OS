'use client';

import { useState, useEffect, useRef } from 'react';
import { getChatMessages, saveChatMessage } from '@/app/actions/chat';
import { createClient } from '@/lib/supabase/client';
import { Send, MessageSquare, Shield, User, Loader2 } from 'lucide-react';

interface ChatProps {
  projectId: string;
  projectName: string;
  currentUserRole: 'ADMIN' | 'CLIENT';
}

export default function Chat({ projectId, projectName, currentUserRole }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    async function loadChat() {
      setIsLoading(true);
      try {
        const history = await getChatMessages(projectId);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChat();
  }, [projectId]);

  // Subscribe to Realtime messages
  useEffect(() => {
    const supabase = createClient();
    
    // Create channel
    const channel = supabase.channel(`project-chat-${projectId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await saveChatMessage(projectId, text.trim());
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setText('');

        // Broadcast to other participants
        const supabase = createClient();
        const channel = supabase.channel(`project-chat-${projectId}`);
        await channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: res.message,
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Project Chat: {projectName}
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold uppercase">Realtime Live</span>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/20">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isAdmin = msg.sender.role === 'ADMIN';
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  isAdmin === (currentUserRole === 'ADMIN') ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {isAdmin ? (
                    <Shield className="w-3 h-3 text-blue-400" />
                  ) : (
                    <User className="w-3 h-3 text-purple-400" />
                  )}
                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                    {msg.sender.name}
                  </span>
                  <span className="text-[8px] text-slate-600">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {/* Bubble */}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isAdmin
                      ? 'bg-blue-600/10 border border-blue-500/20 text-blue-200 rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2">
            <MessageSquare className="w-8 h-8 text-slate-800" />
            <p className="text-xs">No messages yet. Send a message to start aligning!</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950/60 border-t border-slate-900 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
