import { getClients, createClientRecord, onboardClientUser, deleteClientRecord } from '../actions';
import { Users, Building2, UserPlus, Trash2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
        <p className="text-slate-400 text-sm">Onboard clients, manage user accounts, and configure custom dashboard branding.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Clients list Table (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Onboarded Clients</h2>
          
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {clients.length > 0 ? (
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
                    {clients.map((client) => (
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
                          <form action={deleteClientRecord.bind(null, client.id)}>
                            <button
                              type="submit"
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                              title="Delete Client & Users"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
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
            
            <form action={async (formData) => {
              'use server';
              await createClientRecord(formData);
            }} className="space-y-3.5">
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
                className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                Register Company
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* Form 2: Onboard Client User Account */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Onboard Client User</h2>
            </div>
            
            <form action={async (formData) => {
              'use server';
              await onboardClientUser(formData);
            }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Select Client Company</label>
                <select
                  name="clientId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="">-- Choose Company --</option>
                  {clients.map((c) => (
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
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2"
              >
                Provision Client Account
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
