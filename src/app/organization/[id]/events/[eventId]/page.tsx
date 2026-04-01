'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface Registration {
  id: string;
  memberId: string;
  status: string;
  signupOrder: number;
  registeredAt: string;
  member?: {
    id: string;
    player?: {
      user?: {
        firstName: string;
        lastName: string;
        email: string;
      }
    }
  }
}

interface Service {
  id: string;
  providerId: string;
  name: string;
  category: string;
  description: string;
  sourceType: string;
  provider?: {
    id: string;
    userId: string;
    businessName: string;
    phone: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    }
  }
}

interface Reminder {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  remindTime: string;
  reminderType: string;
  isActive: boolean;
  createdAt?: string;
}

interface ClubEvent {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  registrationCap: number;
  entryFee: number;
  prizePool?: number;
  location?: string;
  rules?: string;
  instructions?: string;
  registrations: Registration[];
  services: Service[];
  reminders?: Reminder[];
}

export default function EventDetailsPage() {
  const params = useParams();
  const orgId = params.id as string;
  const eventId = params.eventId as string;
  const { playerId } = useAuth();

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ClubEvent>>({});
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({ staffId: '', role: '', responsibility: '', reason: '' });
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ memberId: '', status: 'registered' });
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [reminderStaffId, setReminderStaffId] = useState<string | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', remindTime: '', reminderType: 'email' });
  const [loadingAddReminder, setLoadingAddReminder] = useState(false);

  useEffect(() => {
    if (orgId && eventId) {
      fetchEventDetails();
      fetchAvailableStaff();
      fetchTasks();
      fetchAvailableMembers();
      fetchReminders();
    }
  }, [orgId, eventId]);

  async function fetchAvailableStaff() {
    try {
      setLoadingStaff(true);
      const res = await fetch(`/api/organization/${orgId}/staff`);
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      setAvailableStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setAvailableStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }

  async function fetchTasks() {
    try {
      setLoadingTasks(true);
      const res = await fetch(`/api/organization/${orgId}/events/${eventId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function fetchReminders() {
    try {
      const res = await fetch(`/api/organization/${orgId}/events/${eventId}/reminders`);
      if (!res.ok) throw new Error('Failed to fetch reminders');
      const data = await res.json();
      setReminders(data || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setReminders([]);
    }
  }

  async function fetchEventDetails() {
    try {
      setLoading(true);
      const res = await fetch(`/api/organization/${orgId}/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      const data = await res.json();
      setEvent(data);
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading event');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEvent() {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update event');
      const updated = await res.json();
      setEvent(updated);
      setEditMode(false);
      toast.success('Event updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event');
    }
  }

  async function handleAssignStaff() {
    if (!event) {
      toast.error('Event not loaded');
      return;
    }
    
    if (!staffForm.staffId) {
      toast.error('Please select staff');
      return;
    }
    if (!staffForm.role) {
      toast.error('Please specify their role');
      return;
    }

    setLoadingAssign(true);
    try {
      // Get selected staff info
      const selectedStaff = availableStaff.find(s => s.id === staffForm.staffId);
      if (!selectedStaff) {
        toast.error('Staff member not found');
        return;
      }

      // 1. First, assign staff to event
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staffForm.staffId,
          role: staffForm.role,
          responsibility: staffForm.responsibility
        })
      });
      if (!res.ok) throw new Error('Failed to assign staff');
      const newService = await res.json();
      
      // 2. Create a task record for this assignment
      const taskRes = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffUserId: staffForm.staffId,
          serviceId: newService.id,
          title: `${staffForm.role} - ${event.name}`,
          description: staffForm.responsibility || '',
          role: staffForm.role,
          responsibility: staffForm.responsibility,
          priority: 'medium'
        })
      });
      if (taskRes.ok) {
        const newTask = await taskRes.json();
        setTasks(prev => [...prev, newTask]);
      }
      
      // 3. Only after successful assignment, create DM room (skip if assigning to self)
      if (selectedStaff.id !== playerId) {
        const dmRes = await authenticatedFetch('/api/chat/dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserEmail: selectedStaff.email })
        });
        
        if (!dmRes.ok) throw new Error('Failed to create DM');
        const dmRoom = await dmRes.json();

        // 4. Send notification message
        const message = `You have been assigned to the event "${event.name}" as a ${staffForm.role}.${staffForm.responsibility ? ` Responsibility: ${staffForm.responsibility}` : ''}${staffForm.reason ? ` Reason: ${staffForm.reason}` : ''}`;
        
        await authenticatedFetch(`/api/chat/rooms/${dmRoom.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message })
        });
      }
      
      // Update the state with the new service without reloading the whole page
      setEvent(prev => prev ? {
        ...prev,
        services: [...(prev.services || []), newService]
      } : null);
      
      setStaffForm({ staffId: '', role: '', responsibility: '', reason: '' });
      setShowStaffForm(false);
      
      if (selectedStaff.id === playerId) {
        toast.success(`You assigned yourself as ${staffForm.role} to this event`);
      } else {
        toast.success(`${selectedStaff.name} assigned successfully with DM notification sent`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign staff');
    } finally {
      setLoadingAssign(false);
    }
  }

  async function handleRemoveStaff(serviceId: string) {
    if (!confirm('Are you sure you want to remove this staff assignment?')) return;

    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/staff?serviceId=${serviceId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove staff');
      
      // Remove from local state instead of reloading the whole page
      setEvent(prev => prev ? {
        ...prev,
        services: (prev.services || []).filter(s => s.id !== serviceId)
      } : null);
      
      toast.success('Staff assignment removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove staff');
    }
  }

  async function fetchAvailableMembers() {
    try {
      const res = await fetch(`/api/organization/${orgId}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setAvailableMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setAvailableMembers([]);
    }
  }

  async function handleSendReminder(task: any) {
    if (!task.assignedTo) {
      toast.error('This task has no assigned staff member');
      return;
    }

    setLoadingReminder(true);
    setReminderStaffId(task.staffUserId);
    try {
      // Create or get DM with staff member
      const dmRes = await authenticatedFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserEmail: task.assignedTo.email })
      });
      
      if (!dmRes.ok) throw new Error('Failed to create DM');
      const dmRoom = await dmRes.json();

      // Send reminder message
      const reminderMessage = `📌 Reminder: You have a pending task in "${event?.name}"\n\n📋 Task: ${task.role}\n📝 Details: ${task.responsibility || 'No additional details'}\n⚠️ Status: ${task.status === 'pending' ? 'Not started' : task.status.replace('_', ' ')}\n${task.dueDate ? `📅 Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}`;
      
      await authenticatedFetch(`/api/chat/rooms/${dmRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reminderMessage })
      });
      
      toast.success(`Reminder sent to ${task.assignedTo.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setLoadingReminder(false);
      setReminderStaffId(null);
    }
  }

  async function handleAddRegistration() {
    if (!registrationForm.memberId) {
      toast.error('Please select a member');
      return;
    }

    setLoadingRegister(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: registrationForm.memberId,
          status: registrationForm.status
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add registration');
      }
      
      const newRegistration = await res.json();
      setEvent(prev => prev ? {
        ...prev,
        registrations: [...(prev.registrations || []), newRegistration]
      } : null);
      
      setRegistrationForm({ memberId: '', status: 'registered' });
      setShowRegistrationForm(false);
      toast.success('Registration added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add registration');
    } finally {
      setLoadingRegister(false);
    }
  }

  async function handleRemoveRegistration(registrationId: string) {
    if (!confirm('Are you sure you want to remove this registration?')) return;

    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/registrations/${registrationId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to remove registration');
      
      setEvent(prev => prev ? {
        ...prev,
        registrations: (prev.registrations || []).filter(r => r.id !== registrationId)
      } : null);
      
      toast.success('Registration removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove registration');
    }
  }

  async function handleUpdateRegistrationStatus(registrationId: string, newStatus: string) {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update registration');
      
      const updatedRegistration = await res.json();
      setEvent(prev => prev ? {
        ...prev,
        registrations: (prev.registrations || []).map(r => 
          r.id === registrationId ? updatedRegistration : r
        )
      } : null);
      
      toast.success('Registration status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update registration');
    }
  }

  async function handleAddReminder() {
    if (!reminderForm.title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }
    if (!reminderForm.remindTime) {
      toast.error('Please specify when to send the reminder');
      return;
    }

    setLoadingAddReminder(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminderForm.title,
          description: reminderForm.description,
          remindTime: reminderForm.remindTime,
          reminderType: reminderForm.reminderType
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add reminder');
      }
      
      const newReminder = await res.json();
      setReminders(prev => [...prev, newReminder]);
      setReminderForm({ title: '', description: '', remindTime: '', reminderType: 'email' });
      setShowReminderForm(false);
      toast.success('Reminder created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add reminder');
    } finally {
      setLoadingAddReminder(false);
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/reminders/${reminderId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete reminder');
      
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      toast.success('Reminder deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete reminder');
    }
  }

  async function handleToggleReminder(reminderId: string, currentStatus: boolean) {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update reminder');
      
      const updatedReminder = await res.json();
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? updatedReminder : r
      ));
      
      toast.success(!currentStatus ? 'Reminder activated' : 'Reminder disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update reminder');
    }
  }

  function isValidDateTime(dateTimeStr: string): boolean {
    try {
      const date = new Date(dateTimeStr + ':00Z');
      return date.getTime() > Date.now();
    } catch {
      return false;
    }
  }

  if (loading) return <div style={{ padding: 20, color: G.muted }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!event) return <div style={{ padding: 20, color: G.muted }}>Event not found</div>;

  const registered = event.registrations?.length || 0;
  const remaining = event.registrationCap - registered;

  return (
    <div style={{ padding: 20, background: G.dark, minHeight: '100vh', color: G.text }}>
      <div style={{  margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Link href={`/dashboard/org/${orgId}?section=events`} style={{ color: G.lime, textDecoration: 'none', fontSize: 12 }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{event.name}</h1>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: '8px 16px',
              background: editMode ? G.mid : G.bright,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {editMode ? 'Cancel' : 'Edit Event'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Event Details Card */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📋 Event Details</h2>
            {editMode ? (
              <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Event Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ padding: 8, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text }}
                />
                <textarea
                  placeholder="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ padding: 8, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text, minHeight: 60 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    placeholder="Entry Fee"
                    value={formData.entryFee || 0}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseFloat(e.target.value) })}
                    style={{ padding: 8, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text }}
                  />
                  <input
                    type="number"
                    placeholder="Prize Pool"
                    value={formData.prizePool || 0}
                    onChange={(e) => setFormData({ ...formData, prizePool: parseFloat(e.target.value) })}
                    style={{ padding: 8, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdateEvent}
                  style={{
                    padding: '10px',
                    background: G.lime,
                    color: G.dark,
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Type</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{event.eventType}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 13 }}>{event.description || 'N/A'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Start Date</div>
                    <div style={{ fontSize: 13 }}>{new Date(event.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>End Date</div>
                    <div style={{ fontSize: 13 }}>{event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Entry Fee</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>${event.entryFee}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Prize Pool</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>${event.prizePool || 0}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Registration Stats */}
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>📊 Registration Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Registered</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: G.lime }}>{registered}</div>
              </div>
              <div style={{ background: G.dark, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Remaining</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: G.accent }}>{remaining}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Capacity</div>
              <div style={{ height: 8, background: G.dark, borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(registered / event.registrationCap) * 100}%`,
                    background: G.lime,
                    borderRadius: 4,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 6 }}>{registered}/{event.registrationCap}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Revenue</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: G.accent }}>${(registered * event.entryFee).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>📋 Tasks</h2>
            <button
              onClick={() => setShowStaffForm(!showStaffForm)}
              style={{
                padding: '6px 12px',
                background: G.bright,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              + Assign Task
            </button>
          </div>

          {showStaffForm && (
            <div style={{ background: G.dark, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Assign To *</label>
                  <select
                    value={staffForm.staffId}
                    onChange={(e) => {
                      const selectedStaff = availableStaff.find(s => s.id === e.target.value);
                      setStaffForm({ 
                        ...staffForm, 
                        staffId: e.target.value,
                        role: selectedStaff?.role || ''
                      });
                    }}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text,
                      cursor: loadingStaff ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loadingStaff}
                  >
                    <option value="">{loadingStaff ? 'loading...' : 'Choose person'}</option>
                    {availableStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} 
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Role *</label>
                  <input
                    type="text"
                    placeholder="e.g., Referee, Coach, Umpire"
                    value={staffForm.role}
                    disabled
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text 
                    }}
                  />
                </div>
              </div>
              <textarea
                placeholder="Responsibility details"
                value={staffForm.responsibility}
                onChange={(e) => setStaffForm({ ...staffForm, responsibility: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  background: G.sidebar, 
                  border: `1px solid ${G.cardBorder}`, 
                  borderRadius: 4, 
                  color: G.text, 
                  marginBottom: 12,
                  minHeight: 50
                }}
              />
              <textarea
                placeholder="Reason for assignment (optional - will be included in DM)"
                value={staffForm.reason}
                onChange={(e) => setStaffForm({ ...staffForm, reason: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  background: G.sidebar, 
                  border: `1px solid ${G.cardBorder}`, 
                  borderRadius: 4, 
                  color: G.text, 
                  marginBottom: 12,
                  minHeight: 50
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAssignStaff}
                  disabled={loadingAssign}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: loadingAssign ? G.mid : G.lime,
                    color: loadingAssign ? G.muted : G.dark,
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    cursor: loadingAssign ? 'not-allowed' : 'pointer',
                    opacity: loadingAssign ? 0.7 : 1
                  }}
                >
                  {loadingAssign ? 'Assigning...' : 'Assign Task'}
                </button>
                <button
                  onClick={() => setShowStaffForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: G.mid,
                    color: G.text,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Display Tasks */}
          {tasks && tasks.length > 0 ? (
            <div>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: G.dark,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                    border: `1px solid ${G.cardBorder}`,
                    opacity: task.status === 'completed' ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: task.status === 'completed' ? G.muted : G.lime, marginBottom: 8 }}>
                        {task.assignedTo?.name || 'Unassigned'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Role</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{task.role}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Status</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: task.status === 'completed' ? G.lime : task.status === 'in_progress' ? G.accent : G.muted }}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Priority</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </div>
                        </div>
                      </div>
                      {task.responsibility && (
                        <div style={{ fontSize: 12, color: G.text, marginBottom: 8 }}>
                          <strong>Responsibility:</strong> {task.responsibility}
                        </div>
                      )}
                      {task.notes && (
                        <div style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>
                          <strong>Notes:</strong> {task.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => handleSendReminder(task)}
                        disabled={loadingReminder && reminderStaffId === task.staffUserId}
                        title={`Send DM reminder to ${task.assignedTo?.name || 'assigned staff'}`}
                        style={{
                          padding: '8px 16px',
                          background: loadingReminder && reminderStaffId === task.staffUserId ? G.mid : G.yellow,
                          color: G.dark,
                          border: 'none',
                          borderRadius: 4,
                          cursor: loadingReminder && reminderStaffId === task.staffUserId ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          opacity: loadingReminder && reminderStaffId === task.staffUserId ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                      >
                        {loadingReminder && reminderStaffId === task.staffUserId ? '⏳ Sending...' : '📧 Remind'}
                      </button>
                      <button
                        onClick={() => {
                          // Delete task
                          authenticatedFetch(`/api/organization/${orgId}/events/${eventId}/tasks?taskId=${task.id}`, {
                            method: 'DELETE'
                          }).then(res => {
                            if (res.ok) {
                              setTasks(prev => prev.filter(t => t.id !== task.id));
                              toast.success('Task removed');
                            }
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: G.muted,
                          border: `1px solid ${G.cardBorder}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, textAlign: 'center', color: G.muted, fontSize: 14 }}>
              No tasks assigned yet
            </div>
          )}
        </div>

        {/* � Event Reminders & Schedule */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>📅 Event Reminders & Schedule</h2>
            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              style={{
                padding: '6px 12px',
                background: G.bright,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              + Add Reminder
            </button>
          </div>

          {showReminderForm && (
            <div style={{ background: G.dark, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Reminder Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Player Check-in, Venue Setup"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Reminder Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={reminderForm.remindTime}
                    onChange={(e) => setReminderForm({ ...reminderForm, remindTime: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text
                    }}
                  />
                  {reminderForm.remindTime && !isValidDateTime(reminderForm.remindTime) && (
                    <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>
                      Please select a valid future date and time
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Description (Optional)</label>
                <textarea
                  placeholder="Add details about this reminder..."
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    background: G.sidebar, 
                    border: `1px solid ${G.cardBorder}`, 
                    borderRadius: 4, 
                    color: G.text, 
                    minHeight: 60
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Reminder Type</label>
                <select
                  value={reminderForm.reminderType}
                  onChange={(e) => setReminderForm({ ...reminderForm, reminderType: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: 8, 
                    background: G.sidebar, 
                    border: `1px solid ${G.cardBorder}`, 
                    borderRadius: 4, 
                    color: G.text,
                    cursor: 'pointer'
                  }}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="chat">Chat Message</option>
                  <option value="notification">In-App Notification</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddReminder}
                  disabled={loadingAddReminder}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: loadingAddReminder ? G.mid : G.lime,
                    color: loadingAddReminder ? G.muted : G.dark,
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    cursor: loadingAddReminder ? 'not-allowed' : 'pointer',
                    opacity: loadingAddReminder ? 0.7 : 1
                  }}
                >
                  {loadingAddReminder ? 'Creating...' : 'Create Reminder'}
                </button>
                <button
                  onClick={() => setShowReminderForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: G.mid,
                    color: G.text,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Display Reminders */}
          {reminders && reminders.length > 0 ? (
            <div>
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  style={{
                    background: G.dark,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                    border: `1px solid ${G.cardBorder}`,
                    opacity: reminder.isActive ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: reminder.isActive ? G.lime : G.muted, marginBottom: 8 }}>
                        {reminder.title}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Scheduled For</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {new Date(reminder.remindTime).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: G.muted, marginBottom: 2 }}>Type</div>
                          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                            {reminder.reminderType}
                          </div>
                        </div>
                      </div>
                      {reminder.description && (
                        <div style={{ fontSize: 12, color: G.text, marginBottom: 8 }}>
                          <strong>Notes:</strong> {reminder.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleReminder(reminder.id, reminder.isActive)}
                        title={reminder.isActive ? 'Disable reminder' : 'Enable reminder'}
                        style={{
                          padding: '8px 16px',
                          background: reminder.isActive ? G.yellow : G.mid,
                          color: reminder.isActive ? G.dark : G.text,
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                      >
                        {reminder.isActive ? '✓ Active' : '○ Inactive'}
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: G.muted,
                          border: `1px solid ${G.cardBorder}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, textAlign: 'center', color: G.muted, fontSize: 14 }}>
              No reminders set yet
            </div>
          )}
        </div>

        {/* �👥 Registrations */}
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>👥 Registrations</h2>
            <button
              onClick={() => setShowRegistrationForm(!showRegistrationForm)}
              style={{
                padding: '6px 12px',
                background: G.bright,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600
              }}
            >
              + Add Registration
            </button>
          </div>

          {showRegistrationForm && (
            <div style={{ background: G.dark, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Select Member *</label>
                  <select
                    value={registrationForm.memberId}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, memberId: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Choose member</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.player?.user?.firstName} {member.player?.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, marginBottom: 6, display: 'block' }}>Status</label>
                  <select
                    value={registrationForm.status}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, status: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: 8, 
                      background: G.sidebar, 
                      border: `1px solid ${G.cardBorder}`, 
                      borderRadius: 4, 
                      color: G.text,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="registered">Registered</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddRegistration}
                  disabled={loadingRegister}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: loadingRegister ? G.mid : G.lime,
                    color: loadingRegister ? G.muted : G.dark,
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    cursor: loadingRegister ? 'not-allowed' : 'pointer',
                    opacity: loadingRegister ? 0.7 : 1
                  }}
                >
                  {loadingRegister ? 'Adding...' : 'Add Registration'}
                </button>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: G.mid,
                    color: G.text,
                    border: `1px solid ${G.cardBorder}`,
                    borderRadius: 4,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {event.registrations && event.registrations.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.cardBorder}` }}>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Order</th>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Member</th>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Registered Date</th>
                  <th style={{ textAlign: 'left', padding: 8, fontSize: 11, color: G.muted, fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {event.registrations.map((reg) => (
                  <tr key={reg.id} style={{ borderBottom: `1px solid ${G.cardBorder}` }}>
                    <td style={{ padding: 8, fontSize: 12 }}>#{reg.signupOrder}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>
                      {reg.member?.player?.user?.firstName} {reg.member?.player?.user?.lastName}
                    </td>
                    <td style={{ padding: 8, fontSize: 12 }}>{reg.member?.player?.user?.email}</td>
                    <td style={{ padding: 8 }}>
                      <select
                        value={reg.status}
                        onChange={(e) => handleUpdateRegistrationStatus(reg.id, e.target.value)}
                        style={{
                          fontSize: 10,
                          padding: '4px 8px',
                          background: G.sidebar + '99',
                          color: reg.status === 'registered' || reg.status === 'confirmed' ? G.lime : G.muted,
                          borderRadius: 4,
                          fontWeight: 700,
                          border: `1px solid ${G.cardBorder}`,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="registered">Registered</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: 8, fontSize: 12, color: G.muted }}>
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 8 }}>
                      <button
                        onClick={() => handleRemoveRegistration(reg.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          color: G.muted,
                          border: `1px solid ${G.cardBorder}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 16, textAlign: 'center', color: G.muted, fontSize: 14 }}>
              No registrations yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
