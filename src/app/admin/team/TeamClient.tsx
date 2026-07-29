'use client';

import React, { useState, useTransition } from 'react';
import { createTeamMemberRecord, deleteTeamMemberRecord } from '../actions';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  User, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { Role } from '@prisma/client';

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: Role;
}

interface TeamClientProps {
  members: TeamMember[];
  currentUserId?: string;
}

export function TeamClient({ members: initialMembers, currentUserId = '' }: TeamClientProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  
  // Status states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Create Team Member
  const handleCreateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createTeamMemberRecord(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Administrator account provisioned successfully!');
        form.reset();
        window.location.reload();
      }
    });
  };

  // Revoke Team Member
  const handleDeleteMember = async (id: string) => {
    if (id === currentUserId) {
      alert('You cannot revoke your own administrator account.');
      return;
    }
    if (!confirm('Are you sure you want to revoke this administrator\'s access? This will permanently delete their account credentials.')) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await deleteTeamMemberRecord(id);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setMembers(prev => prev.filter(m => m.id !== id));
        setSuccessMsg('Administrator credentials successfully revoked.');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Staff Management</h1>
        <p className="text-muted text-sm font-semibold">Provision secondary administrator logins and manage access privileges.</p>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-[14px] text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-success/10 border border-success/20 rounded-[14px] text-xs text-success flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Staff List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase font-medium">Platform Administrators</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-surface border border-border rounded-[20px] p-5 space-y-4 hover:border-border/80 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold uppercase text-foreground shrink-0 shadow-inner">
                      {member.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{member.name}</h3>
                      <span className="text-[10px] text-muted truncate block mt-0.5">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {member.role}
                    </span>
                    {member.id === currentUserId && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active Session
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border mt-2">
                  {member.id !== currentUserId ? (
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="flex items-center gap-1 text-[10px] bg-background hover:bg-red-950/20 border border-border hover:border-red-950/30 px-3 py-1.5 rounded-[10px] text-muted hover:text-danger font-bold transition-all"
                      disabled={isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke access
                    </button>
                  ) : (
                    <span className="text-[9px] text-muted flex items-center gap-1 font-bold">
                      <Lock className="w-3 h-3 text-slate-500" />
                      SYSTEM LOCKED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Create Admin Form (1/3 width) */}
        <div>
          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Administrator</h2>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-650 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="sarah@vesastudios.com"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-650 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-650 focus:outline-none focus:border-primary/80 transition-colors font-semibold"
                />
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
                    <span>Add Administrator</span>
                    <Plus className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
