"use client";

import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

export default function StaffManager({ orgId, staff = [], onChange, readOnly = false }: any) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Coach');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role }),
      });
      if (res.ok) {
        setName('');
        setRole('Coach');
        setShowAddForm(false);
        onChange?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((staff?.length || 0) / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = (staff || []).slice(startIndex, startIndex + PAGE_SIZE);

  const totalStaff = staff?.length || 0;
  const activeStaff = staff?.filter((s: any) => s.isActive !== false).length || 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM8 13a6 6 0 00-6 6v1h14v-1a6 6 0 00-6-6z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Staff</h3>
              <p className="text-blue-100 text-sm">Manage coaches and staff members</p>
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
              <span>Add Staff</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalStaff}</div>
                <div className="text-blue-100 text-sm mt-1">Total Staff</div>
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
                <div className="text-3xl font-bold">{activeStaff}</div>
                <div className="text-blue-100 text-sm mt-1">Active</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4z" clipRule="evenodd" />
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
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && !readOnly && (
        <div className="p-6 bg-white border-b-2 border-blue-200">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Staff</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Name</label>
                <input
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Role</label>
                <input
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Role (e.g., Head Coach)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreate}
                disabled={loading || !name}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                {loading ? 'Adding...' : 'Add Staff'}
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

      {/* Staff List */}
      <div className="p-6">
        {totalStaff === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM8 13a6 6 0 00-6 6v1h14v-1a6 6 0 00-6-6z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-700 mb-2">No staff members</h4>
            <p className="text-gray-500 mb-4">Start by adding staff to manage your organization.</p>
            {!readOnly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First Staff</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {paginated.map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl border-2 border-blue-100 p-5 hover:shadow-lg hover:border-blue-300 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center font-bold text-blue-700 text-lg shadow-md">
                        { (s.name || '').split(' ').map((p: string) => p.charAt(0)).slice(0,2).join('') }
                      </div>

                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-sm text-gray-500">{s.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 font-medium ${s.isActive ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </div>

                      {!readOnly && (
                        <button className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center text-blue-700 transition-all opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
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
                    <span className="font-bold text-blue-700">{Math.min(startIndex + PAGE_SIZE, totalStaff)}</span> of{' '}
                    <span className="font-bold text-blue-700">{totalStaff}</span> staff
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
                        const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700'}`}
                          >
                            {page}
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
              <p className="text-sm text-blue-700">Log in to add or manage staff members.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
