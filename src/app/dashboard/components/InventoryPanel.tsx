import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function InventoryPanel({ inventory }: { inventory: any[] }) {
  const router = useRouter();

  // Calculate statistics
  const totalItems = inventory?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
  const lowStockItems = inventory?.filter(item => (item.count || 0) < 5).length || 0;

  // Get condition badge styling
  const getConditionStyle = (condition: string) => {
    const cond = condition?.toLowerCase() || 'good';
    switch (cond) {
      case 'excellent':
      case 'new':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'poor':
      case 'needs repair':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get stock level indicator
  const getStockLevel = (count: number) => {
    if (count === 0) return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' };
    if (count < 5) return { label: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (count < 10) return { label: 'In Stock', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Well Stocked', color: 'text-green-600', bg: 'bg-green-50' };
  };

  // Get item icon based on category or name
  const getItemIcon = (item: any) => {
    const name = item.name?.toLowerCase() || '';
    const category = item.category?.toLowerCase() || '';
    
    if (name.includes('ball') || category.includes('ball')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (name.includes('racket') || name.includes('racquet') || category.includes('racket')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    }
    if (name.includes('net') || category.includes('net')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Equipment Inventory</h3>
              <p className="text-green-100 text-xs">
                {inventory?.length || 0} items • {totalItems} total units
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/inventory')} 
            className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-semibold shadow-md"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage
            </span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {inventory && inventory.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Items</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-green-600">{inventory.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Categories</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {lowStockItems}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {(!inventory || inventory.length === 0) ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-gray-700 font-semibold mb-2">No Inventory Items</h4>
            <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
              Start adding equipment to track your tennis club's inventory.
            </p>
            <Button 
              onClick={() => router.push('/inventory/add')} 
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add First Item
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {inventory.slice(0, 5).map((item: any) => {
              const stockLevel = getStockLevel(item.count || 0);
              
              return (
                <div 
                  key={item.id}
                  className="group relative bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-md">
                        {getItemIcon(item)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {/* Condition Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getConditionStyle(item.condition)}`}>
                              {item.condition || 'Good'}
                            </span>
                            
                            {/* Category Badge */}
                            {item.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock Count */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {item.count || 0}
                          </div>
                          <div className={`text-xs font-semibold ${stockLevel.color}`}>
                            {stockLevel.label}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              item.count === 0 ? 'bg-red-500' :
                              item.count < 5 ? 'bg-orange-500' :
                              item.count < 10 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((item.count / 20) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => router.push(`/inventory/request/${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-green-200 text-green-700 text-xs font-semibold hover:bg-green-50 hover:border-green-300 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Request
                        </button>
                        <button 
                          onClick={() => router.push(`/inventory/${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Warning */}
                  {item.count > 0 && item.count < 5 && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-orange-800 font-medium">
                        Low stock alert - Consider restocking soon
                      </span>
                    </div>
                  )}

                  {/* Out of Stock Warning */}
                  {item.count === 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-red-800 font-medium">
                        Out of stock - Restock immediately
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* View All Link */}
            {inventory.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  onClick={() => router.push('/inventory')}
                  className="text-green-600 hover:text-green-700 font-semibold text-sm inline-flex items-center gap-1 group"
                >
                  View all {inventory.length} items
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerts Footer */}
      {lowStockItems > 0 && inventory && inventory.length > 0 && (
        <div className="border-t border-gray-200 bg-orange-50 px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-orange-900">
              {lowStockItems} {lowStockItems === 1 ? 'item needs' : 'items need'} restocking
            </span>
          </div>
        </div>
      )}
    </div>
  );
}