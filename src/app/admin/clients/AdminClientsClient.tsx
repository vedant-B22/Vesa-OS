'use client';

import React, { useState, useTransition } from 'react';
import { 
  createClientRecord, 
  updateClientRecord, 
  deleteClientRecord, 
  onboardClientUser 
} from '../actions';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Palette, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  users: User[];
  projects: Project[];
}

interface AdminClientsClientProps {
  initialClients: Client[];
}

export default function AdminClientsClient({ initialClients }: AdminClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [onboardingClient, setOnboardingClient] = useState<Client | null>(null);

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Create Client
  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createClientRecord(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Client organization created successfully!');
        form.reset();
        window.location.reload();
      }
    });
  };

  // Update Client
  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    setModalErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await updateClientRecord(editingClient.id, formData);
      if (res?.error) {
        setModalErrorMsg(res.error);
      } else {
        setSuccessMsg('Client profile updated successfully!');
        setEditingClient(null);
        window.location.reload();
      }
    });
  };

  // Delete Client
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will remove all associated users, projects, deliverables, and data files.')) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await deleteClientRecord(id);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setClients(prev => prev.filter(c => c.id !== id));
        setSuccessMsg('Client deleted successfully.');
      }
    });
  };

  // Onboard User account
  const handleOnboardUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onboardingClient) return;
    setModalErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('clientId', onboardingClient.id);

    startTransition(async () => {
      const res = await onboardClientUser(formData);
      if (res?.error) {
        setModalErrorMsg(res.error);
      } else {
        setSuccessMsg(`Successfully provisioned account for client!`);
        setOnboardingClient(null);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
        <p className="text-muted text-sm">Provision corporate workspaces, configure company branding colors, and manage client user accounts.</p>
      </div>

      {/* Global Toast Alerts */}
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
        
        {/* Left Side: Client Accounts List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase font-medium">Active Workspaces</h2>

          {clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-surface border border-border rounded-[20px] p-5 space-y-4 hover:border-border/80 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {client.logoUrl ? (
                          <img src={client.logoUrl} alt={client.name} className="w-7 h-7 rounded-[8px] object-cover border border-border" />
                        ) : (
                          <div className="w-7 h-7 rounded-[8px] bg-card border border-border flex items-center justify-center text-xs font-bold text-foreground">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <h3 className="text-base font-bold text-white leading-tight truncate max-w-[120px]">{client.name}</h3>
                      </div>
                      
                      {/* Interactive Client Branding Indicator */}
                      <div className="flex gap-1 shrink-0 p-1 bg-background border border-border rounded-[8px]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: client.primaryColor }} title="Primary Color" />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: client.secondaryColor }} title="Secondary Color" />
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 bg-card border border-border p-3 rounded-[14px] text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted block">Users Onboarded</span>
                        <span className="font-semibold text-foreground">{client.users?.length || 0} Accounts</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted block">Projects Tracked</span>
                        <span className="font-semibold text-foreground">{client.projects?.length || 0} Active</span>
                      </div>
                    </div>

                    {/* User accounts breakdown */}
                    {client.users && client.users.length > 0 && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-[9px] uppercase font-bold text-muted block">Onboarded staff logins</span>
                        <div className="space-y-1">
                          {client.users.map((u) => (
                            <div key={u.id} className="text-[10px] text-slate-400 bg-background/50 px-2.5 py-1 rounded-[8px] border border-border/40 truncate">
                              {u.name} &bull; <span className="text-muted">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2 pt-3 border-t border-border mt-2">
                    <button
                      onClick={() => setOnboardingClient(client)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-background border border-border hover:bg-card text-[10px] font-bold text-primary rounded-[10px] transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Account
                    </button>
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-1.5 bg-background border border-border hover:bg-card text-muted hover:text-foreground rounded-[10px] transition-colors"
                      title="Edit Branding"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-1.5 bg-background border border-border hover:bg-red-950/20 text-muted hover:text-danger rounded-[10px] transition-colors"
                      title="Delete Workspace"
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-[20px] p-16 text-center text-slate-500 text-xs shadow-inner">
              No corporate workspaces created yet. Use the prompt panel on the right.
            </div>
          )}
        </div>

        {/* Right Side: Create Workspace Form (1/3 width) */}
        <div>
          <div className="bg-surface border border-border rounded-[20px] p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Client Workspace</h2>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Company Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 focus:outline-none focus:border-primary/80 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Primary Color</label>
                  <div className="relative">
                    <input
                      name="primaryColor"
                      type="color"
                      defaultValue="#0f172a"
                      className="w-full h-8 px-1.5 py-1 bg-background border border-border rounded-[10px] cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Secondary Color</label>
                  <div className="relative">
                    <input
                      name="secondaryColor"
                      type="color"
                      defaultValue="#3b82f6"
                      className="w-full h-8 px-1.5 py-1 bg-background border border-border rounded-[10px] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
                <input
                  name="logoUrl"
                  type="url"
                  placeholder="https://acme.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-background/50 border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 focus:outline-none focus:border-primary/80 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Workspace</span>
                    <Plus className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Onboard Client user Account Modal */}
      {onboardingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-white">Provision User Login</h3>
                <p className="text-[10px] text-muted mt-0.5">Link credentials to: {onboardingClient.name}</p>
              </div>
              <button
                onClick={() => setOnboardingClient(null)}
                className="p-1 hover:bg-card border border-transparent hover:border-border rounded-[8px] text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-[12px] text-xs text-danger flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleOnboardUser} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full User Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john@clientcorp.com"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground placeholder-slate-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Provision Account</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client colors Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-surface border border-border rounded-[20px] p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-white">Edit Client Profile</h3>
                <p className="text-[10px] text-muted mt-0.5">Workspace: {editingClient.name}</p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1 hover:bg-card border border-transparent hover:border-border rounded-[8px] text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-[12px] text-xs text-danger flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Company Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingClient.name}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Primary Color</label>
                  <input
                    name="primaryColor"
                    type="color"
                    defaultValue={editingClient.primaryColor}
                    className="w-full h-8 px-1.5 py-1 bg-background border border-border rounded-[10px] cursor-pointer animate-fade-in"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Secondary Color</label>
                  <input
                    name="secondaryColor"
                    type="color"
                    defaultValue={editingClient.secondaryColor}
                    className="w-full h-8 px-1.5 py-1 bg-background border border-border rounded-[10px] cursor-pointer animate-fade-in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
                <input
                  name="logoUrl"
                  type="url"
                  defaultValue={editingClient.logoUrl || ''}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-[14px] text-xs text-foreground outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-[14px] shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
