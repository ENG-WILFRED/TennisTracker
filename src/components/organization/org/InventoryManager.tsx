"use client";

import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

export default function InventoryManager({ orgId, items = [], onChange, readOnly = false }: any) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(1);
  const [condition, setCondition] = useState('Good');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, count, condition }),
      });
      if (res.ok) {
        setName('');
        setCount(1);
        setCondition('Good');
        setShowAddForm(false);
        onChange?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = (items || []).slice(startIndex, startIndex + PAGE_SIZE);

  // Calculate stats
  const totalItems = items?.length || 0;
  const totalUnits = items?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;
  const conditions = items?.reduce((acc: any, item: any) => {
    const cond = item.condition || 'Good';
    acc[cond] = (acc[cond] || 0) + 1;
    return acc;
  }, {});

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Excellent': return 'text-green-700 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Fair': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Poor': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getConditionIcon = (cond: string) => {
    switch (cond) {
      case 'Excellent':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Good':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Fair':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'Poor':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Inventory</h3>
              <p className="text-blue-100 text-sm">Manage your organization's assets</p>
            </div>
          </div>
          
          {!readOnly && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Item</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalItems}</div>
                <div className="text-blue-100 text-sm mt-1">Total Items</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalUnits}</div>
                <div className="text-blue-100 text-sm mt-1">Total Units</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{currentPage}/{totalPages}</div>
                <div className="text-blue-100 text-sm mt-1">Current Page</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && !readOnly && (
        <div className="p-6 bg-white border-b-2 border-blue-200">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Item</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Item Name</label>
                <input 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  placeholder="Enter item name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  value={count} 
                  onChange={(e) => setCount(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">Condition</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Excellent', 'Good', 'Fair', 'Poor'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setCondition(cond)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      condition === cond
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-700 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleCreate}
                disabled={loading || !name}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Item</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="p-6">
        {totalItems === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-700 mb-2">No items in inventory</h4>
            <p className="text-gray-500 mb-4">Start by adding your first item to track your inventory.</p>
            {!readOnly && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First Item</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {paginated.map((it: any, idx: number) => (
                <div 
                  key={it.id} 
                  className="bg-white rounded-xl border-2 border-blue-100 p-5 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center font-bold text-blue-700 text-lg shadow-md">
                        {startIndex + idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-bold text-lg text-blue-900 mb-1">{it.name}</div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">{it.count}</span>
                            <span className="text-gray-500">units</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 font-medium ${getConditionColor(it.condition || 'Good')}`}>
                        {getConditionIcon(it.condition || 'Good')}
                        <span>{it.condition || 'Good'}</span>
                      </div>
                      
                      <button className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center text-blue-700 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-900 font-medium">
                    Showing <span className="font-bold text-blue-700">{startIndex + 1}</span> to{' '}
                    <span className="font-bold text-blue-700">{Math.min(startIndex + PAGE_SIZE, totalItems)}</span> of{' '}
                    <span className="font-bold text-blue-700">{totalItems}</span> items
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setCurrentPage(1)} 
                      disabled={currentPage === 1} 
                      className="px-4 py-2 rounded-lg border-2 border-blue-300 bg-white text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                      <span>First</span>
                    </button>
                    
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                      disabled={currentPage === 1} 
                      className="px-4 py-2 rounded-lg border-2 border-blue-300 bg-white text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                : 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                      disabled={currentPage === totalPages} 
                      className="px-4 py-2 rounded-lg border-2 border-blue-300 bg-white text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => setCurrentPage(totalPages)} 
                      disabled={currentPage === totalPages} 
                      className="px-4 py-2 rounded-lg border-2 border-blue-300 bg-white text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                    >
                      <span>Last</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Read Only Message */}
        {readOnly && (
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Read-Only Mode</h4>
              <p className="text-sm text-blue-700">Log in to add or manage inventory items.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}