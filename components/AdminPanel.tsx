
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storageService } from '../services/storageService';
import { User, KnowledgeEntry } from '../types';
import { Modal } from './Modal';

interface AdminPanelProps {
  onEditEntry: (entry: KnowledgeEntry) => void;
}

type SortField = 'title' | 'contentLength' | 'source' | 'date';
type ContentLengthFilter = 'all' | 'short' | 'medium' | 'long';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onEditEntry }) => {
  const [activeTab, setActiveTab] = useState<'database' | 'users'>('database');
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter & Sort states
  const [dbSearch, setDbSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ai' | 'manual' | 'database'>('all');
  const [lengthFilter, setLengthFilter] = useState<ContentLengthFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddCoreModalOpen, setIsAddCoreModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<KnowledgeEntry | null>(null);

  // New Core Asset Form State
  const [newCoreTitle, setNewCoreTitle] = useState('');
  const [newCoreContent, setNewCoreContent] = useState('');
  const [newCoreImage, setNewCoreImage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Add User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const data = await storageService.getEntries();
    setEntries(data);
    setUsers(storageService.getAllUsers());
  };

  const handleCreateCoreAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCoreTitle.trim() || !newCoreContent.trim()) {
      setFormError('Title and detailed content are required.');
      return;
    }

    await storageService.save(newCoreTitle, newCoreContent, 'database', undefined, newCoreImage.trim() || undefined);
    setNewCoreTitle('');
    setNewCoreContent('');
    setNewCoreImage('');
    setIsAddCoreModalOpen(false);
    refreshData();
  };

  const handleExport = async () => {
    const data = await storageService.exportKnowledge();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sk-engine-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const result = await storageService.importKnowledge(content);
      if (result.success) {
        alert(`Successfully imported ${result.count} records to IndexedDB.`);
        refreshData();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleGlobalReset = async () => {
    await storageService.clearAllKnowledge();
    setIsResetModalOpen(false);
    refreshData();
    alert('IndexedDB purged successfully.');
  };

  const handlePromoteToCore = async (id: string) => {
    await storageService.updateSource(id, 'database');
    refreshData();
  };

  const handleDemoteToManual = async (id: string) => {
    await storageService.updateSource(id, 'manual');
    refreshData();
  };

  const handlePromoteAllManual = async () => {
    if (!confirm('This will convert all human-curated entries into Protected Core Assets. Continue?')) return;
    for (const e of entries) {
      if (e.source === 'manual') await storageService.updateSource(e.id, 'database');
    }
    refreshData();
  };

  const openDeleteConfirmation = (entry: KnowledgeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (entryToDelete) {
      await storageService.deleteEntry(entryToDelete.id);
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      refreshData();
    }
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'admin-1') return alert('Access Denied: Cannot delete the root system administrator.');
    if (!confirm('Remove this user and their associated permissions?')) return;
    storageService.deleteUser(id);
    refreshData();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail) return;
    storageService.register(newUsername, newEmail, newRole);
    setNewUsername('');
    setNewEmail('');
    setNewRole('user');
    refreshData();
    alert('User created successfully.');
  };

  const resetFilters = () => {
    setDbSearch('');
    setSourceFilter('all');
    setLengthFilter('all');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setSortBy('date');
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const processedEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      // Search matching
      const matchesSearch = entry.title.toLowerCase().includes(dbSearch.toLowerCase()) || 
                           entry.content.toLowerCase().includes(dbSearch.toLowerCase());
      
      // Source matching
      const matchesSource = sourceFilter === 'all' || entry.source === sourceFilter;

      // Length matching
      let matchesLength = true;
      const len = entry.content.length;
      if (lengthFilter === 'short') matchesLength = len < 100;
      else if (lengthFilter === 'medium') matchesLength = len >= 100 && len <= 500;
      else if (lengthFilter === 'long') matchesLength = len > 500;
      
      // Date range matching
      let matchesDate = true;
      if (startDate) {
        const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
        matchesDate = matchesDate && entry.createdAt >= startTimestamp;
      }
      if (endDate) {
        const endTimestamp = new Date(endDate + 'T23:59:59').getTime();
        matchesDate = matchesDate && entry.createdAt <= endTimestamp;
      }

      return matchesSearch && matchesSource && matchesLength && matchesDate;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'contentLength':
          comparison = a.content.length - b.content.length;
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
        case 'date':
        default:
          comparison = a.createdAt - b.createdAt;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [entries, dbSearch, sourceFilter, lengthFilter, sortOrder, sortBy, startDate, endDate]);

  const stats = {
    total: entries.length,
    ai: entries.filter(e => e.source === 'ai').length,
    manual: entries.filter(e => e.source === 'manual').length,
    database: entries.filter(e => e.source === 'database').length,
    users: users.length
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  const isFilterActive = dbSearch !== '' || sourceFilter !== 'all' || lengthFilter !== 'all' || startDate !== '' || endDate !== '';

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <i className="fas fa-sort ml-1.5 opacity-20"></i>;
    return <i className={`fas fa-sort-amount-${sortOrder === 'desc' ? 'down' : 'up'} ml-1.5 text-blue-600`}></i>;
  };

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      title: sortOrder === 'asc' ? 'A → Z' : 'Z → A',
      contentLength: sortOrder === 'asc' ? 'Shortest' : 'Longest',
      source: sortOrder === 'asc' ? 'A → Z' : 'Z → A',
      date: sortOrder === 'asc' ? 'Oldest' : 'Newest'
    };
    return labels[sortBy];
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Terminal</h2>
          <p className="text-slate-500 font-medium text-lg">Centralized governance for search index and user permissions.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner backdrop-blur-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab('database')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'database' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <i className="fas fa-database"></i>
            Knowledge Center
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <i className="fas fa-user-lock"></i>
            User Access
          </button>
        </div>
      </div>

      {activeTab === 'database' ? (
        <div className="space-y-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><i className="fas fa-layer-group"></i></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Records</p>
              </div>
              <p className="text-4xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-indigo-50/30 transition-colors" onClick={() => setSourceFilter('ai')}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><i className="fas fa-robot"></i></div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">AI Content</p>
              </div>
              <p className="text-4xl font-black text-indigo-600">{stats.ai}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-emerald-50/30 transition-colors" onClick={() => setSourceFilter('manual')}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><i className="fas fa-keyboard"></i></div>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Manual Entries</p>
              </div>
              <p className="text-4xl font-black text-emerald-600">{stats.manual}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50/30 transition-colors" onClick={() => setSourceFilter('database')}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><i className="fas fa-shield-alt"></i></div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">Core Assets</p>
              </div>
              <p className="text-4xl font-black text-blue-600">{stats.database}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><i className="fas fa-users"></i></div>
                <p className="text-purple-400 text-xs font-bold uppercase tracking-wider">Auth Users</p>
              </div>
              <p className="text-4xl font-black text-purple-600">{stats.users}</p>
            </div>
          </div>

          {/* Maintenance & Management Sections */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000">
               <i className="fas fa-server text-[160px]"></i>
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                      <i className="fas fa-tools text-blue-400"></i>
                      Database Operations
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      Perform high-level system tasks. Backup your entire search index or perform a global injection of knowledge records from JSON files.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleExport}
                      className="bg-white/10 hover:bg-white/20 px-6 py-3.5 rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest"
                    >
                      <i className="fas fa-download text-blue-400"></i>
                      Export JSON
                    </button>
                    <button 
                      onClick={handleImportClick}
                      className="bg-white/10 hover:bg-white/20 px-6 py-3.5 rounded-2xl border border-white/10 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest"
                    >
                      <i className="fas fa-upload text-emerald-400"></i>
                      Import Data
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".json"
                      onChange={handleFileChange}
                    />
                    <button 
                      onClick={() => setIsResetModalOpen(true)}
                      className="bg-red-500/10 hover:bg-red-500 hover:text-white px-6 py-3.5 rounded-2xl border border-red-500/20 text-red-400 transition-all flex items-center gap-3 text-sm font-black uppercase tracking-widest"
                    >
                      <i className="fas fa-fire"></i>
                      Global Reset
                    </button>
                  </div>
               </div>

               <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div>
                    <h4 className="text-xl font-black mb-2 flex items-center gap-3 text-blue-300">
                      <i className="fas fa-shield-virus"></i>
                      Core Record Management
                    </h4>
                    <p className="text-slate-400 text-xs font-medium">Manage entries designated as Core System Assets. Core entries are prioritized in search results.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsAddCoreModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl shadow-lg transition-all text-xs font-black uppercase tracking-wider flex flex-col items-center gap-2"
                    >
                      <i className="fas fa-plus-square text-xl"></i>
                      Create Core Asset
                    </button>
                    <button 
                      onClick={handlePromoteAllManual}
                      className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-100 p-4 rounded-xl border border-emerald-600/20 transition-all text-xs font-black uppercase tracking-wider flex flex-col items-center gap-2"
                    >
                      <i className="fas fa-arrow-up-right-from-square text-xl"></i>
                      Promote Manual
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* Filter Header Section */}
            <div className={`p-8 border-b border-slate-100 transition-colors ${isFilterActive ? 'bg-blue-50/30' : 'bg-slate-50/50'}`}>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="relative flex-grow">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text" 
                      placeholder="Search knowledge by title or keywords..." 
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="w-full pl-14 pr-4 py-4.5 rounded-[1.25rem] border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-base shadow-inner bg-white font-medium"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    <div className="relative min-w-[160px] flex-grow">
                      <select 
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as any)}
                        className="w-full pl-10 pr-8 py-4.5 rounded-[1.25rem] border-2 border-slate-100 outline-none bg-white text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors appearance-none"
                      >
                        <option value="all">Any Origin</option>
                        <option value="ai">AI Context</option>
                        <option value="manual">Human Input</option>
                        <option value="database">Core Assets</option>
                      </select>
                      <i className="fas fa-microchip absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none text-xs"></i>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
                    </div>

                    <div className="relative min-w-[160px] flex-grow">
                      <select 
                        value={lengthFilter}
                        onChange={(e) => setLengthFilter(e.target.value as any)}
                        className="w-full pl-10 pr-8 py-4.5 rounded-[1.25rem] border-2 border-slate-100 outline-none bg-white text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors appearance-none"
                      >
                        <option value="all">Any Length</option>
                        <option value="short">Short (&lt;100)</option>
                        <option value="medium">Medium (100-500)</option>
                        <option value="long">Long (&gt;500)</option>
                      </select>
                      <i className="fas fa-text-height absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none text-xs"></i>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
                    </div>

                    <button 
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="px-6 py-4.5 rounded-[1.25rem] border-2 border-slate-100 bg-white text-sm font-bold text-slate-600 flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm min-w-[140px]"
                    >
                      <i className={`fas fa-sort-amount-${sortOrder === 'desc' ? 'down' : 'up'} text-blue-600`}></i>
                      {getSortLabel()}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <div className="flex flex-wrap items-center gap-8 w-full md:w-auto">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <i className="far fa-calendar-alt text-blue-400"></i>
                        Date From:
                      </span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <i className="fas fa-calendar-check text-emerald-400"></i>
                        Date To:
                      </span>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {isFilterActive && (
                    <button 
                      onClick={resetFilters}
                      className="text-[11px] font-black text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-3 bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl transition-all uppercase tracking-widest"
                    >
                      <i className="fas fa-sync-alt"></i>
                      Reset Global Views
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Knowledge Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th 
                      className={`w-1/4 px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors ${sortBy === 'title' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={() => handleSort('title')}
                    >
                      Subject / Visual {getSortIcon('title')}
                    </th>
                    <th 
                      className={`w-1/3 px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors ${sortBy === 'contentLength' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={() => handleSort('contentLength')}
                    >
                      Content Depth {getSortIcon('contentLength')}
                    </th>
                    <th 
                      className={`w-44 px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors ${sortBy === 'source' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={() => handleSort('source')}
                    >
                      Origin Source {getSortIcon('source')}
                    </th>
                    <th 
                      className={`w-48 px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors ${sortBy === 'date' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={() => handleSort('date')}
                    >
                      Date Indexed {getSortIcon('date')}
                    </th>
                    <th className="w-48 px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {processedEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-blue-50/40 transition-all group">
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                              {entry.imageUrl ? (
                                <img src={entry.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <i className="fas fa-image text-xs"></i>
                                </div>
                              )}
                           </div>
                           <p className={`font-extrabold text-base transition-colors truncate ${sortBy === 'title' ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-700'}`}>{entry.title}</p>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col gap-1.5">
                          <p className={`text-sm line-clamp-2 italic font-medium leading-relaxed ${sortBy === 'contentLength' ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>{entry.content}</p>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{entry.content.length} characters</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border flex items-center gap-2 w-fit ${
                          entry.source === 'ai' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          entry.source === 'manual' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          entry.source === 'database' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          <i className={`fas ${entry.source === 'ai' ? 'fa-bolt' : entry.source === 'manual' ? 'fa-pen-nib' : 'fa-shield-halved'} text-[8px]`}></i>
                          {entry.source === 'ai' ? 'AI Sync' : entry.source === 'manual' ? 'Human' : 'Core'}
                        </span>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${sortBy === 'date' ? 'text-blue-700' : 'text-slate-700'}`}>{formatDate(entry.createdAt)}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">Verified Record</span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right space-x-2 whitespace-nowrap">
                        {entry.source !== 'database' ? (
                          <button 
                            onClick={() => handlePromoteToCore(entry.id)}
                            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm group/btn"
                            title="Promote to Core"
                          >
                            <i className="fas fa-shield-halved text-xs group-hover/btn:scale-110 transition-transform"></i>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDemoteToManual(entry.id)}
                            className="w-10 h-10 rounded-2xl bg-white border border-blue-200 text-blue-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all shadow-sm group/btn"
                            title="Demote to Manual"
                          >
                            <i className="fas fa-user-edit text-xs group-hover/btn:scale-110 transition-transform"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => onEditEntry(entry)}
                          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm group/btn"
                        >
                          <i className="fas fa-pen text-xs group-hover/btn:scale-110 transition-transform"></i>
                        </button>
                        <button 
                          onClick={() => openDeleteConfirmation(entry)}
                          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm group/btn"
                        >
                          <i className="fas fa-trash-alt text-xs group-hover/btn:scale-110 transition-transform"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* User Access Tab Content */
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contributor Identity</th>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Auth Level</th>
                    <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-6">
                        <p className="font-extrabold text-slate-800 text-lg leading-none">{user.username}</p>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{user.email}</p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                          <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved mr-2' : 'fa-user-check mr-2'}`}></i>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        {user.id === 'admin-1' ? (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protected Core</span>
                        ) : (
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-widest border border-transparent hover:border-red-100"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl h-fit sticky top-28">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-inner border border-blue-100">
                <i className="fas fa-user-plus"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Provision User</h3>
                <p className="text-slate-400 text-sm font-medium">Grant system credentials.</p>
              </div>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Label</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white font-bold" 
                  placeholder="e.g. Lead Researcher"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Endpoint</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white font-bold" 
                  placeholder="auth@skengine.net"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Privilege Group</label>
                <div className="relative">
                  <select 
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm appearance-none bg-slate-50 pr-12 cursor-pointer font-black text-slate-700"
                  >
                    <option value="user">Collaborator</option>
                    <option value="admin">Super Administrator</option>
                  </select>
                  <i className="fas fa-caret-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-4 uppercase text-xs tracking-[0.25em] mt-4 group"
              >
                Create Account
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Core Asset Creation Modal */}
      {isAddCoreModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsAddCoreModalOpen(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full p-10 animate-fade-in overflow-hidden border border-slate-200">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-indigo-100">
                <i className="fas fa-shield-halved"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Inject Core Asset</h3>
                <p className="text-slate-400 text-sm font-medium">Adding record directly to protected tier.</p>
              </div>
            </div>

            <form onSubmit={handleCreateCoreAsset} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asset Title</label>
                  <input 
                    type="text"
                    value={newCoreTitle}
                    onChange={e => setNewCoreTitle(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white font-bold"
                    placeholder="e.g. Distributed Ledger Technology"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asset Visual (URL)</label>
                  <input 
                    type="url"
                    value={newCoreImage}
                    onChange={e => setNewCoreImage(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white font-bold"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Definitive Content</label>
                <textarea 
                  value={newCoreContent}
                  onChange={e => setNewCoreContent(e.target.value)}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all h-48 resize-none text-sm leading-relaxed bg-slate-50 focus:bg-white font-medium"
                  placeholder="Provide the high-authority definition..."
                  required
                />
              </div>
              
              {formError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i>
                  {formError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all uppercase text-xs tracking-widest"
                >
                  Finalize Injection
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddCoreModalOpen(false)}
                  className="px-8 py-4 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteEntry}
        title="Destroy Record"
        message={`This action will permanently purge the knowledge node "${entryToDelete?.title}" from the distributed index. This is irreversible.`}
      />

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleGlobalReset}
        title="DANGER: SYSTEM RESET"
        message="You are about to clear the ENTIRE knowledge database. This will erase all AI and manual entries across the system. This action requires high-level clearance and is irreversible. Proceed?"
      />
    </div>
  );
};
