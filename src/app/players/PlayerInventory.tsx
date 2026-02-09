"use client";
import React, { useState } from "react";

interface InventoryItem {
  id: string;
  name: string;
  borrowed?: boolean;
}

export default function PlayerInventory({ items }: { items: InventoryItem[] }) {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const total = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  const start = (page - 1) * pageSize;
  const current = items?.slice(start, start + pageSize) || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Inventory</h3>
        <div className="text-sm text-gray-500">{total} items</div>
      </div>

      {total === 0 ? (
        <div className="text-center py-8 bg-gradient-to-br from-green-50 to-sky-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm text-gray-500">No items in inventory</p>
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            {current.map((it) => (
              <div key={it.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-sky-50 rounded-lg border border-gray-200 hover:border-sky-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">{it.name}</span>
                </div>
                {it.borrowed && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Borrowed
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => goTo(page - 1)} disabled={page === 1} className="px-3 py-1 rounded-md border border-gray-200 bg-white disabled:opacity-50">
                Prev
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => goTo(i + 1)} className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => goTo(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded-md border border-gray-200 bg-white disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
