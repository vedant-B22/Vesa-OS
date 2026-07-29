'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Terminal, 
  Users, 
  FolderKanban, 
  FileCheck, 
  Video, 
  FolderOpen, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  LogOut,
  Clock
} from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const items = [
    { label: 'Go to Overview', icon: Terminal, action: () => router.push('/admin') },
    { label: 'Go to Clients Panel', icon: Users, action: () => router.push('/admin/clients') },
    { label: 'Go to Project Tracker', icon: FolderKanban, action: () => router.push('/admin/projects') },
    { label: 'Go to Deliverables Review', icon: FileCheck, action: () => router.push('/admin/deliverables') },
    { label: 'Go to File Vault', icon: FolderOpen, action: () => router.push('/admin/files') },
    { label: 'Go to Video Meetings', icon: Video, action: () => router.push('/admin/meetings') },
    { label: 'Go to Live Chat channels', icon: MessageSquare, action: () => router.push('/admin/chat') },
    { label: 'Go to Billing & Invoices', icon: CreditCard, action: () => router.push('/admin/billing') },
    { label: 'Go to Business Analytics', icon: BarChart3, action: () => router.push('/admin/analytics') },
    { label: 'Go to Team Management', icon: ShieldAlert, action: () => router.push('/admin/team') },
    { label: 'Go to Activity Logs', icon: Clock, action: () => router.push('/admin/activity') },
    { label: 'Go to System Settings', icon: Settings, action: () => router.push('/admin/settings') },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (item: typeof items[0]) => {
    item.action();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) setIsOpen(false);
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-[15vh]"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or shortcut... (e.g. Go to Billing)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder-slate-500"
          />
          <span className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-semibold shrink-0">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching commands or pages found.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-800 bg-slate-950/20 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Use</span>
            <span className="px-1 py-0.5 bg-slate-850 border border-slate-800 rounded">↑↓</span>
            <span>to navigate</span>
            <span>and</span>
            <span className="px-1 py-0.5 bg-slate-850 border border-slate-800 rounded">Enter</span>
            <span>to select</span>
          </div>
          <span>VESA OS Console</span>
        </div>
      </div>
    </div>
  );
}
