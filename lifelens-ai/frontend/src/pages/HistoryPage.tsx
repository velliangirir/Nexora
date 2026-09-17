import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Decision } from '../types';
import { Search, PlusCircle, Sliders, Trash2, AlertTriangle, Sparkles, RefreshCw, Trash } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { token } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Single Delete Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete All Modal State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [dupMsg, setDupMsg] = useState('');

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const textSnippet = await res.text();
      console.error(`Received non-JSON response from ${url}:`, textSnippet.substring(0, 300));
      throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}).`);
    }

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
    }
    return data;
  };

  const fetchDecisions = async () => {
    try {
      const activeToken = token || localStorage.getItem('futlens_token') || 'demo_token';
      const data = await safeFetchJson('/api/decisions', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setDecisions(data.decisions || []);
    } catch (err) {
      console.error('Error fetching decisions history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [token]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    const activeToken = token || localStorage.getItem('futlens_token') || 'demo_token';
    setIsDeleting(true);

    // Instantly purge card from local state
    setDecisions((prev) => prev.filter((d) => d.id !== targetId));
    setDeletingId(null);

    try {
      await safeFetchJson(`/api/decisions/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
    } catch (err: any) {
      console.log('Delete decision execution:', err?.message);
    } finally {
      setIsDeleting(false);
      fetchDecisions();
    }
  };

  const confirmDeleteAll = async () => {
    const activeToken = token || localStorage.getItem('futlens_token') || 'demo_token';
    setIsDeletingAll(true);

    // Instantly purge all cards from local state
    setDecisions([]);
    setIsDeleteAllModalOpen(false);

    try {
      const data = await safeFetchJson('/api/decisions/all', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setDupMsg(data?.message || 'All decision history has been permanently deleted.');
    } catch (err: any) {
      console.log('Delete all execution:', err?.message);
    } finally {
      setIsDeletingAll(false);
      fetchDecisions();
    }
  };

  const handleCleanDuplicates = async () => {
    setCleaningDuplicates(true);
    setDupMsg('');
    try {
      const data = await safeFetchJson('/api/decisions/deduplicate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDupMsg(data.removedCount > 0 ? `Removed ${data.removedCount} duplicate record(s).` : 'No duplicates found.');
      fetchDecisions();
    } catch (err: any) {
      console.error('Error deduplicating decisions:', err);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const filtered = decisions.filter((d) => {
    const matchesCat = categoryFilter === 'all' || d.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const decisionToDelete = decisions.find((d) => d.id === deletingId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* TOP BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">Decision Archive</span>
          <h1 className="text-3xl font-extrabold text-white">Decision History & Models</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {decisions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDeleteAllModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all"
              title="Delete all decision history"
            >
              <Trash className="w-3.5 h-3.5" />
              Delete All History
            </button>
          )}

          <button
            onClick={handleCleanDuplicates}
            disabled={cleaningDuplicates}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
            title="Clean duplicate decision records if any exist"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${cleaningDuplicates ? 'animate-spin' : ''}`} />
            {cleaningDuplicates ? 'Cleaning...' : 'Deduplicate History'}
          </button>

          <Link
            to="/create"
            className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Create New Decision
          </Link>
        </div>
      </div>

      {dupMsg && (
        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          {dupMsg}
        </div>
      )}

      {/* SEARCH & FILTER BAR */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by decision title or category..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Career">Career</option>
            <option value="Education">Education</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="General">General</option>
          </select>
        </div>

      </div>

      {/* DECISIONS GRID */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {loading ? 'Loading decision history...' : 'No decisions match your search filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dec) => (
            <div key={dec.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 glass-card-hover flex flex-col justify-between">
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {dec.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    dec.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {dec.status === 'completed' ? 'Completed' : 'Active Simulation'}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{dec.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{dec.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Created: {new Date(dec.created_at).toLocaleDateString()}</span>
                  <span className="font-mono text-sky-300">{dec.option_count || 2} Options</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to={`/simulator/${dec.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Launch Simulator
                  </Link>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDeletingId(dec.id);
                    }}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
                    title="Delete Decision"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SINGLE DECISION DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Decision?</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {deletingId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              This will permanently remove <strong className="text-white">"{decisionToDelete?.title || 'this decision'}"</strong> and its associated simulation results, options, scenarios, and Reality Check data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ALL HISTORY CONFIRMATION MODAL */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/15 rounded-2xl border border-rose-500/30">
                <Trash className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete All Decision History?</h3>
                <p className="text-xs text-rose-400 font-semibold">{decisions.length} Total Decision(s)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              Are you sure you want to permanently delete <strong className="text-rose-400">ALL {decisions.length} decision(s)</strong> from your history? This will permanently remove all decision models, options, factors, What-If simulation results, and Reality Check data. <span className="text-rose-400 font-semibold">This action cannot be undone.</span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                disabled={isDeletingAll}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-600/40 transition-all flex items-center gap-2"
              >
                <Trash className="w-4 h-4" />
                {isDeletingAll ? 'Deleting All History...' : 'Delete All History'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
