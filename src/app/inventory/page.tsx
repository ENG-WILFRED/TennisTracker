"use client";
import { useEffect, useMemo, useState } from "react";
import { getInventory, borrowItem, createOrUpdateItem } from "@/actions/inventory";
import { useToast } from '@/components/ToastProvider';
import Button from '@/components/Button';
import ExtrasPanel from '@/components/ExtrasPanel';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const PAGE_SIZE = 30;
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  useEffect(() => {
    setPlayerId(typeof window !== 'undefined' ? localStorage.getItem('playerId') : null);
    fetchItems();
  }, []);

  function fetchItems() {
    setLoading(true);
    getInventory()
      .then((res) => setItems(res))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }

  async function handleBorrow(id: string) {
    setError(null);
    try {
      await borrowItem(playerId, id, 1);
      fetchItems();
      showToast('Request sent — item reserved.', 'success');
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      showToast(msg, 'error');
    }
  }

  async function handleSave(item: any) {
    setError(null);
    try {
      await createOrUpdateItem(playerId, item);
      setEditing(null);
      fetchItems();
      showToast('Inventory updated.', 'success');
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      showToast(msg, 'error');
    }
  }

  const conditions = useMemo(() => Array.from(new Set(items.map(i => i.condition || 'Good'))), [items]);

  const filtered = useMemo(() => {
    let out = items.slice();
    if (query) out = out.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
    if (onlyAvailable) out = out.filter(i => i.count > 0);
    if (conditionFilter) out = out.filter(i => (i.condition || 'Good') === conditionFilter);
    if (sortBy === 'name') out.sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === 'count') out.sort((a,b) => b.count - a.count);
    return out;
  }, [items, query, onlyAvailable, conditionFilter, sortBy]);

  // reset page when filters or items change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, onlyAvailable, conditionFilter, sortBy, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const getConditionColor = (condition: string) => {
    switch(condition?.toLowerCase()) {
      case 'excellent': return 'from-green-500 to-emerald-600';
      case 'good': return 'from-blue-500 to-cyan-600';
      case 'fair': return 'from-yellow-500 to-orange-500';
      case 'poor': return 'from-orange-500 to-red-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getConditionBadge = (condition: string) => {
    switch(condition?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="w-full">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Inventory Management</h1>
                <p className="text-green-100">Club & player equipment tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <div className="text-white mr-4">
                <div className="text-xs opacity-80">Total Items</div>
                <div className="text-xl font-bold">{items.length}</div>
              </div>
              {playerId && (
                <Button onClick={() => setShowAddModal(true)} className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h2 className="text-lg font-bold text-green-900">Search & Filter</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Search items..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* Condition Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select 
                    value={conditionFilter} 
                    onChange={e => setConditionFilter(e.target.value)} 
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                  >
                    <option value="">All conditions</option>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Sort */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)} 
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="count">Sort: Count</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Available Toggle & Stats */}
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <label className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={onlyAvailable} 
                    onChange={e => setOnlyAvailable(e.target.checked)} 
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-green-800">Show only available items</span>
                </label>
                <div className="text-sm text-gray-600">
                  Showing <span className="font-bold text-green-700">{filtered.length}</span> of <span className="font-semibold">{items.length}</span> items
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginated.map((it) => (
                    <div 
                      key={it.id} 
                      className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
                    >
                      {/* Item Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getConditionColor(it.condition || 'Good')} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-green-700 transition-colors">
                            {it.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getConditionBadge(it.condition || 'Good')}`}>
                            {it.condition || 'Good'}
                          </span>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-xs text-gray-600">
                          Provided by <span className="font-semibold text-gray-800">{it.clubId || 'Club'}</span>
                        </span>
                      </div>

                      {/* Count & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${it.count > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {it.count}
                          </div>
                          <span className="text-xs text-gray-500">in stock</span>
                        </div>
                        <div className="flex gap-2">
                          {playerId ? (
                            <>
                              <Button 
                                onClick={() => handleBorrow(it.id)} 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                                disabled={it.count === 0}
                              >
                                Request
                              </Button>
                              <Button 
                                onClick={() => setEditing(it)} 
                                variant="outline" 
                                className="text-sm border-gray-300 hover:border-green-400 hover:bg-green-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" className="text-sm">View</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filtered.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                )}

                {/* Pagination Controls */}
                {filtered.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">Showing <span className="font-bold">{Math.min(startIndex+1, filtered.length)}</span> - <span className="font-bold">{Math.min(startIndex + paginated.length, filtered.length)}</span> of <span className="font-semibold">{filtered.length}</span></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded border bg-white/50 disabled:opacity-50">First</button>
                      <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded border bg-white/50 disabled:opacity-50">Prev</button>
                      <div className="px-3 py-1 rounded border bg-white/50">Page {currentPage} / {totalPages}</div>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border bg-white/50 disabled:opacity-50">Next</button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border bg-white/50 disabled:opacity-50">Last</button>
                    </div>
                  </div>
                )}

                {/* Edit Item Form */}
                {playerId && editing && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">Edit Item</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        value={editing.name} 
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                        placeholder="Item name"
                        className="md:col-span-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input 
                        value={editing.count} 
                        type="number" 
                        onChange={(e) => setEditing({ ...editing, count: Number(e.target.value) })} 
                        placeholder="Count"
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input 
                        value={editing.condition} 
                        onChange={(e) => setEditing({ ...editing, condition: e.target.value })} 
                        placeholder="Condition"
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button 
                        onClick={() => handleSave(editing)} 
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg shadow-sm"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => setEditing(null)} 
                        variant="outline" 
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Add Item Modal */}
                {showAddModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
                    <div className="bg-white rounded-xl shadow-lg p-6 z-10 w-full max-w-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Add New Inventory Item</h3>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input placeholder="Item name" id="modal-new-name" className="md:col-span-2 px-4 py-2.5 border border-gray-300 rounded-lg" />
                        <input placeholder="Count" id="modal-new-count" type="number" className="px-4 py-2.5 border border-gray-300 rounded-lg" />
                        <input placeholder="Condition" id="modal-new-condition" className="px-4 py-2.5 border border-gray-300 rounded-lg" />
                      </div>
                      <div className="flex items-center justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} className="px-4 py-2">Cancel</Button>
                        <Button onClick={() => {
                          const nameEl = document.getElementById('modal-new-name') as HTMLInputElement | null;
                          const countEl = document.getElementById('modal-new-count') as HTMLInputElement | null;
                          const condEl = document.getElementById('modal-new-condition') as HTMLInputElement | null;
                          if (!nameEl || !nameEl.value) return;
                          handleSave({ name: nameEl.value, count: Number(countEl?.value || 0), condition: condEl?.value || 'Good' });
                          nameEl.value = '';
                          if (countEl) countEl.value = '';
                          if (condEl) condEl.value = '';
                          setShowAddModal(false);
                        }} className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white">Add Item</Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Help Panel */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Quick Links</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Manage club resources and personnel</p>
              <div className="space-y-2">
                <a 
                  href="/staff" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 hover:from-green-100 hover:to-emerald-100 transition-all group"
                >
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium group-hover:translate-x-1 transition-transform">View Staff</span>
                </a>
                <a 
                  href="/coaches" 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 hover:from-blue-100 hover:to-cyan-100 transition-all group"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium group-hover:translate-x-1 transition-transform">View Coaches</span>
                </a>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Inventory Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-lg font-bold text-green-600">{items.filter(i => i.count > 0).length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">Out of Stock</span>
                  <span className="text-lg font-bold text-red-600">{items.filter(i => i.count === 0).length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}