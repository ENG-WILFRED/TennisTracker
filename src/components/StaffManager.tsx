"use client"

import React, { useEffect, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import Button from '@/components/Button'
import { getAllStaff, createStaff, updateStaff, deleteStaff, unemployCoach } from '@/actions/staff'

export default function StaffManager({ initialStaff }: { initialStaff?: any[] }) {
  const [staff, setStaff] = useState<any[]>(initialStaff || [])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', role: 'Coach', expertise: '', contact: '', photo: '' })
  const { showToast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const list = await getAllStaff()
      setStaff(list || [])
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to load staff', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialStaff || initialStaff.length === 0) load()
  }, [])

  function resetForm() {
    setEditing(null)
    setForm({ name: '', role: 'Coach', expertise: '', contact: '', photo: '' })
  }

  async function handleCreate() {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    setLoading(true)
    try {
      await createStaff(actorId, form)
      showToast && showToast('Staff created', 'success')
      await load()
      resetForm()
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to create staff', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!editing) return
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    setLoading(true)
    try {
      await updateStaff(actorId, editing.id, form)
      showToast && showToast('Staff updated', 'success')
      await load()
      resetForm()
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to update staff', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    if (!confirm('Delete this staff member?')) return
    setLoading(true)
    try {
      await deleteStaff(actorId, id)
      showToast && showToast('Staff deleted', 'success')
      await load()
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to delete', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnemploy(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    if (!confirm('Un-employ this staff member?')) return
    setLoading(true)
    try {
      await unemployCoach(actorId, id)
      showToast && showToast('Coach unemployed', 'success')
      await load()
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to unemploy', 'error')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(s: any) {
    setEditing(s)
    setForm({ name: s.name || '', role: s.role || 'Coach', expertise: s.expertise || '', contact: s.contact || '', photo: s.photo || '' })
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border rounded-md px-3 py-2" />
        <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role" className="border rounded-md px-3 py-2" />
        <input value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} placeholder="Expertise" className="border rounded-md px-3 py-2" />
        <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Contact (email)" className="border rounded-md px-3 py-2" />
      </div>

      <div className="flex gap-2 mb-6">
        {editing ? (
          <>
            <Button onClick={handleUpdate}>Save</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </>
        ) : (
          <Button onClick={handleCreate}>Create Staff</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && staff.length === 0 ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-gray-500">No staff found.</div>
        ) : staff.map(s => (
          <div key={s.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="font-semibold text-green-800">{s.name}</div>
            <div className="text-sm text-gray-500">{s.role} · {s.expertise}</div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" onClick={() => startEdit(s)}>Edit</Button>
              <Button onClick={() => handleDelete(s.id)} className="bg-red-50 text-red-700">Delete</Button>
              {typeof window !== 'undefined' && (() => {
                const actorId = localStorage.getItem('playerId')
                if (s.employedById && actorId && s.employedById === actorId) {
                  return <Button variant="outline" onClick={() => handleUnemploy(s.id)} className="text-sm">Un-employ</Button>
                }
                return null
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
