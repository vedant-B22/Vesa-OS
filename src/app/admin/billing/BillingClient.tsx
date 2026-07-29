'use client';

import React, { useState, useTransition } from 'react';
import { createInvoiceRecord, recordPaymentRecord } from '../actions';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Search,
  X,
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { InvoiceStatus } from '@prisma/client';

interface Client {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: Date;
}

interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  createdAt: Date;
  client: Client;
  payments: Payment[];
}

interface BillingClientProps {
  initialInvoices: Invoice[];
  clients: Client[];
}

export function BillingClient({ initialInvoices, clients }: BillingClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isPaymentPending, startPaymentTransition] = useTransition();

  // Metrics
  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID');
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);
  const totalOutstanding = unpaidInvoices.reduce((acc, i) => acc + i.amount, 0);
  const totalCollected = invoices
    .filter(i => i.status === 'PAID')
    .reduce((acc, i) => acc + i.amount, 0);

  const statusColors: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    SENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    CANCELLED: 'bg-slate-700/10 text-slate-500 border-slate-800',
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.id.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createInvoiceRecord(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Invoice generated successfully!');
        form.reset();
        window.location.reload();
      }
    });
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('invoiceId', selectedInvoice.id);

    startPaymentTransition(async () => {
      const res = await recordPaymentRecord(formData);
      if (res?.error) {
        setPaymentErrorMsg(res.error);
      } else {
        form.reset();
        setSelectedInvoice(null);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing & Invoices</h1>
        <p className="text-slate-400 text-sm">Issue design invoices, record client payments, and track agency earnings.</p>
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

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Gross Invoiced</span>
            <p className="text-xl font-bold text-white">${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-850 bg-slate-900 text-blue-400">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Collected Income</span>
            <p className="text-xl font-bold text-emerald-400">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 backdrop-blur-sm border border-slate-900 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Outstanding Balances</span>
            <p className="text-xl font-bold text-amber-500">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Invoices List Panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/10 border border-slate-900 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl w-full sm:max-w-xs text-slate-400">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by client or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-slate-200 w-full placeholder-slate-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none w-full sm:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-900">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="p-5 flex items-center justify-between hover:bg-slate-900/20 transition-colors">
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-400 font-mono truncate">INV-{invoice.id.slice(0, 8).toUpperCase()}</h3>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.2 rounded border ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-200 truncate">{invoice.client.name}</p>
                      <span className="text-[10px] text-slate-500 block">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-200">${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    
                    {invoice.status !== 'PAID' && (
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-transparent text-blue-400 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Record Payment
                      </button>
                    )}
                    {invoice.status === 'PAID' && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl">
                        Paid Complete
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-500 text-sm">
                No matching invoices found.
              </div>
            )}
          </div>
        </div>

        {/* Generate Invoice Form (1/3 width) */}
        <div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">New Invoice</h2>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
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
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Invoice Amount ($)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2500.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Status</label>
                <select
                  name="status"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500/80 transition-colors"
                >
                  <option value="SENT">Sent (Awaiting Payment)</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 disabled:opacity-55"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Invoice</span>
                    <FileText className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Record Payment Dialog Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-mono">INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Recording payment from: {selectedInvoice.client.name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentErrorMsg && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{paymentErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Payment Method</label>
                <select
                  name="method"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                >
                  <option value="Stripe">Stripe Card Payment</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Manual Check">Manual Business Check</option>
                  <option value="Cash / Manual">Cash or Manual Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Amount Paid ($)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={selectedInvoice.amount}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Status</label>
                <select
                  name="status"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                >
                  <option value="SUCCESS">Success (Completed)</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPaymentPending}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {isPaymentPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Record Receipt</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
