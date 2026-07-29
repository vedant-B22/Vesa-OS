'use client';

import React, { useState, useTransition } from 'react';
import { createTeamMemberRecord, deleteTeamMemberRecord } from '../actions';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Mail, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

interface TeamClientProps {
  members: TeamMember[];
}

export function TeamClient({ members }: TeamClientProps) {
  const [team, setTeam] = useState<TeamMember[]>(members);
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
        setSuccessMsg('Administrator account added successfully!');
        form.reset();
        window.location.reload();
      }
    });
  };

  // Delete Team Member
  const handleDeleteMember = async (userId: string) => {
    if (members.length <= 1) {
      alert('Cannot delete the last remaining administrator account. System access must be preserved.');
      return;
    }
    if (!confirm('Are you sure you want to revoke administrator privileges and delete this account?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await deleteTeamMemberRecord(userId);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setTeam(prev => prev.filter(m => m.id !== userId));
        setSuccessMsg('Administrator account removed successfully.');
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Team Management</h1>
        <p className="text-slate-400 text-sm">Manage studio administrator accounts, passwords, and security controls.</p>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Admins List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-medium">Administrator Staff</h2>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900 shadow-lg">
            {team.map((member) => (
              <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{member.name}</h3>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      Staff
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-500 font-medium">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                  
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors"
                    title="Remove Admin"
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Invite Admin Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Provision Admin</h2>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    className="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="sarah@vesastudios.com"
                    className="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Secure Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 disabled:opacity-55"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
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
