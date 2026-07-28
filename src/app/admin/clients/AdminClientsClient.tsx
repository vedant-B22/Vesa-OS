'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClientRecord, onboardClientUser, deleteClientRecord } from '../actions';
import { Users, Building2, UserPlus, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface ClientWithRelations {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  users: { id: string }[];
  projects: { id: string }[];
}

interface AdminClientsClientProps {
  initialClients: ClientWithRelations[];
}

export default function AdminClientsClient({ initialClients }: AdminClientsClientProps) {
  const router = useRouter();
  const [isPendingCompany, startTransitionCompany] = useTransition();
  const [isPendingUser, startTransitionUser] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Submit Handler: New Client Company
  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submit: New Client Company triggered");
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    
    console.log("Before validation: Checking inputs for Company");
    if (!name) {
      console.warn("Validation failed: Company name is missing");
      setFeedback({ message: 'Company name is required.', type: 'error' });
      return;
    }

    setFeedback(null);
    startTransitionCompany(async () => {
      try {
        console.log("Before API request: createClientRecord", { name });
        const res = await createClientRecord(formData);
        console.log("After API response: createClientRecord", res);

        if (res && 'error' in res && res.error) {
          console.warn("Server action returned error:", res.error);
          setFeedback({ message: res.error, type: 'error' });
        } else {
          console.log("Success: Company registered successfully");
          setFeedback({ message: 'Company registered successfully!', type: 'success' });
          form.reset();
          router.refresh();
        }
      } catch (err: any) {
        console.error("Inside catch block: createClientRecord failed", err);
        setFeedback({ message: err.message || 'An error occurred during company creation.', type: 'error' });
      }
    });
  };

  // Form Submit Handler: Onboard Client User Account
  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submit: Onboard Client User triggered");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const clientId = formData.get('clientId') as string;

    console.log("Before validation: Checking inputs for User onboarding");
    if (!name || !email || !password || !clientId) {
      console.warn("Validation failed: Missing required fields");
      setFeedback({ message: 'All fields are required.', type: 'error' });
      return;
    }

    setFeedback(null);
    startTransitionUser(async () => {
      try {
        console.log("Before API request: onboardClientUser", { name, email, clientId });
        const res = await onboardClientUser(formData);
        console.log("After API response: onboardClientUser", res);

        if (res && 'error' in res && res.error) {
          console.warn("Server action returned error:", res.error);
          setFeedback({ message: res.error, type: 'error' });
        } else {
          console.log("Success: Client user account provisioned successfully");
          setFeedback({ message: 'Client account provisioned successfully!', type: 'success' });
          form.reset();
          router.refresh();
        }
      } catch (err: any) {
        console.error("Inside catch block: onboardClientUser failed", err);
        setFeedback({ message: err.message || 'An error occurred during client user onboarding.', type: 'error' });
      }
    });
  };

  // Delete Action Handler
  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}" and all associated users?`)) return;
    console.log("Button click: Delete Client clicked for", { id, name });

    setDeletingId(id);
    setFeedback(null);
    startTransitionDelete(async () => {
      try {
        console.log("Before API request: deleteClientRecord for id:", id);
        await deleteClientRecord(id);
        console.log("After API response: deleteClientRecord success");
        setFeedback({ message: `Client "${name}" deleted successfully.`, type: 'success' });
        router.refresh();
      } catch (err: any) {
        console.error("Inside catch block: deleteClientRecord failed", err);
        setFeedback({ message: err.message || 'Failed to delete client.', type: 'error' });
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
        <p className="text-slate-400 text-sm">Onboard clients, manage user accounts, and configure custom dashboard branding.</p>
      </div>

      {/* Global Status/Feedback Notification Block */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
              : 'bg-red-950/30 border-red-500/20 text-red-400'
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-xs font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Clients list Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Onboarded Clients</h2>
          
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {initialClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-xs font-semibold text-slate-500 bg-slate-950/40">
                      <th className="p-4">Logo & Company</th>
                      <th className="p-4">Brand Colors</th>
                      <th className="p-4">Users</th>
                      <th className="p-4">Projects</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {initialClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-900/10 transition-colors text-sm text-slate-200">
                        {/* Name and logo */}
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold uppercase overflow-hidden">
                            {client.logoUrl ? (
                              <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              client.name.slice(0, 2)
                            )}
                          </div>
                          <span className="font-semibold text-slate-200">{client.name}</span>
                        </td>
                        {/* Colors */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-800"
                              style={{ backgroundColor: client.primaryColor }}
                              title="Primary Color"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-slate-800"
                              style={{ backgroundColor: client.secondaryColor }}
                              title="Secondary Color"
                            />
                          </div>
                        </td>
                        {/* Users Count */}
                        <td className="p-4">
                          <span className="text-xs font-medium bg-slate-950 px-2.5 py-1 rounded-full border border-slate-900">
                            {client.users.length} Users
                          </span>
                        </td>
                        {/* Projects Count */}
                        <td className="p-4">
                          <span className="text-xs font-medium bg-slate-950 px-2.5 py-1 rounded-full border border-slate-900">
                            {client.projects.length} Active
                          </span>
                        </td>
                        {/* Delete Action */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            disabled={deletingId === client.id}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Client & Users"
                          >
                            {deletingId === client.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500">
                No clients registered. Use the panel on the right to register one.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Forms (1/3 width) */}
        <div className="space-y-6">
          
          {/* Form 1: Create Client Organization */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Client Company</h2>
            </div>
            
            <form onSubmit={handleCompanySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Company Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Primary Color</label>
                  <input
                    name="primaryColor"
                    type="color"
                    defaultValue="#0f172a"
                    className="w-full h-10 p-1 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Secondary Color</label>
                  <input
                    name="secondaryColor"
                    type="color"
                    defaultValue="#3b82f6"
                    className="w-full h-10 p-1 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Logo URL (Optional)</label>
                <input
                  name="logoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPendingCompany}
                className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPendingCompany ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    Register Company
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Form 2: Onboard Client User Account */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Onboard Client User</h2>
            </div>
            
            <form onSubmit={handleUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Client Company</label>
                <select
                  name="clientId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="">-- Choose Company --</option>
                  {initialClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">User Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john@client.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Initial Password</label>
                <input
                  name="password"
                  type="text"
                  required
                  placeholder="Password (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPendingUser}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPendingUser ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    Provision Client Account
                    <ArrowRight className="w-3 h-3" />
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
