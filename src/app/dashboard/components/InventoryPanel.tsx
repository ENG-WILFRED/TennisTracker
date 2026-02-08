import React from 'react';

export default function InventoryPanel({ inventory }: { inventory: any[] }) {
  // inventory: [{ id, name, count, condition }]
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-800 font-semibold">Inventory</h3>
        <button className="text-sm px-3 py-1 rounded-md bg-white border border-green-200 text-green-700">Manage</button>
      </div>

      {(!inventory || inventory.length === 0) ? (
        <div className="text-gray-500">No inventory items found.</div>
      ) : (
        <ul className="space-y-2">
          {inventory.slice(0,5).map((item: any) => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">{item.name}</div>
                <div className="text-sm text-gray-500">{item.condition || 'Good'}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-green-600">{item.count}</div>
                <button className="px-2 py-1 rounded-md bg-white border border-green-200 text-green-700 text-sm">Request</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
