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
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-green-800">Inventory</h1>
          <div className="text-sm text-gray-600">Club & player inventory management</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="flex gap-3 flex-wrap">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items..." className="flex-1 border rounded-md px-3 py-2" />
                <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="border rounded-md px-3 py-2">
                  <option value="">All conditions</option>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded-md px-3 py-2">
                  <option value="name">Sort: Name</option>
                  <option value="count">Sort: Count</option>
                </select>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} className="accent-green-500" /> Only available
                </label>
              </div>
            </div>

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((it) => (
                  <div key={it.id} className="bg-white rounded-lg p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-green-800 text-lg">{it.name}</div>
                      <div className="text-sm text-gray-500">{it.condition || 'Good'}</div>
                      <div className="text-xs text-gray-400">Provided by: {it.clubId || 'Club'}</div>
                    </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">{it.count}</div>
                        <div className="flex gap-2">
                          {playerId ? (
                            <>
                              <Button onClick={() => handleBorrow(it.id)} className="text-sm">Request</Button>
                              <Button onClick={() => setEditing(it)} variant="outline" className="text-sm">Edit</Button>
                            </>
                          ) : (
                            <Button variant="outline" className="text-sm">View</Button>
                          )}
                        </div>
                      </div>
                  </div>
                ))}

                {playerId && editing && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-lg p-4 shadow-sm">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">Edit Item</h2>
                    <div className="flex gap-2">
                      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="flex-1 border px-2 py-1 rounded-md" />
                      <input value={editing.count} type="number" onChange={(e) => setEditing({ ...editing, count: Number(e.target.value) })} className="w-24 border px-2 py-1 rounded-md" />
                      <input value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} className="w-40 border px-2 py-1 rounded-md" />
                      <Button onClick={() => handleSave(editing)} className="px-3 py-1">Save</Button>
                      <Button onClick={() => setEditing(null)} variant="outline" className="px-3 py-1">Cancel</Button>
                    </div>
                  </div>
                )}

                {playerId && !editing && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-lg p-4 shadow-sm">
                    <h2 className="text-lg font-semibold text-green-800 mb-2">Add Item</h2>
                    <div className="flex gap-2">
                      <input placeholder="Name" id="new-name" className="flex-1 border px-2 py-1 rounded-md" />
                      <input placeholder="Count" id="new-count" type="number" className="w-24 border px-2 py-1 rounded-md" />
                      <input placeholder="Condition" id="new-condition" className="w-40 border px-2 py-1 rounded-md" />
                      <Button onClick={() => {
                        const nameEl = document.getElementById('new-name') as HTMLInputElement | null;
                        const countEl = document.getElementById('new-count') as HTMLInputElement | null;
                        const condEl = document.getElementById('new-condition') as HTMLInputElement | null;
                        if (!nameEl) return;
                        handleSave({ name: nameEl.value, count: Number(countEl?.value || 0), condition: condEl?.value });
                      }} className="px-3 py-1">Add</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-4">
            <ExtrasPanel />
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-green-800 font-semibold mb-2">Inventory Help</h3>
              <p className="text-sm text-gray-600 mb-3">Manage items here. To view or manage staff and coaches, use the links below.</p>
              <div className="flex flex-col gap-2">
                <a href="/staff" className="text-sm px-3 py-2 rounded-md bg-white border border-green-200 text-green-700 text-center">View Staff</a>
                <a href="/coaches" className="text-sm px-3 py-2 rounded-md bg-white border border-green-200 text-green-700 text-center">View Coaches</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
