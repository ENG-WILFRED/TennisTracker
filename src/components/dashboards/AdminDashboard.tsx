'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/LoadingState';
import { MembershipSwitcher } from '@/components/MembershipSwitcher';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { downloadReportPdf } from '@/lib/reportPdf';
import { useToast } from '@/components/ui/ToastContext';
import { DashboardErrorPage } from '@/components/DashboardErrorPage';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type StaffMember = { id: string; name: string; role: string; department: string; status: string; attendance: string; userId?: string; email?: string };

type AdminDashboardData = {
  manager?: {
    role?: string;
    name?: string;
    organizationId?: string;
    organizationName?: string;
  };
  organizationId?: string;
  operationalStats?: {
    activeStaff: number;
    pendingTasks: number;
    maintenanceAlerts: number;
    recentIncidents: number;
    attendanceToday: string;
  };
  staff?: Array<{ id: string; name: string; role: string; department: string; status: string; attendance: string }>;
  departments?: Array<{ name: string; staffCount: number; status: string; performance: string }>;
  pendingTasks?: Array<{ id: string; title: string; assignee: string; priority: string; dueDate: string }>;
  maintenanceRequests?: Array<{ id: string; facility: string; issue: string; status: string; reportedDate: string }>;
  incidents?: Array<{ id: string; type: string; description: string; status: string; reportedBy: string; date: string }>;
  inventory?: Array<{ id: string; item: string; quantity: number; unit: string; status: string }>;
};

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define nav items for Organization Admin
  const navItems = [
    { label: 'Overview', icon: '📊', section: 'overview' },
    { label: 'Staff', icon: '👥', section: 'staff' },
    { label: 'Recruit Staff', icon: '🎯', section: 'recruit' },
    { label: 'Tasks', icon: '✓', section: 'tasks' },
    { label: 'Operations', icon: '⚙️', section: 'operations' },
    { label: 'Maintenance', icon: '🔧', section: 'maintenance' },
    { label: 'Reports', icon: '📈', section: 'reports' },
    { label: 'Incidents', icon: '⚠️', section: 'incidents' },
    { label: 'Inventory', icon: '📦', section: 'inventory' },
    { label: 'Settings', icon: '⚙️', section: 'settings' },
  ];

  // Map section URL param to label
  const sectionParam = searchParams.get('section') || 'overview';
  const activeNav = navItems.find(item => item.section === sectionParam)?.label || 'Overview';

  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle navigation to a new section
  const handleNavigation = (section: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    params.delete('tab');
    router.push(`?${params.toString()}`, { scroll: false });
    setSidebarOpen(false);
    addToast(`Switched to ${section} section`, 'info');
  };

  type MaintenanceRequest = { id: string; facility: string; issue: string; status: string; reportedDate: string };
  type CourtOption = { id: string; name: string; courtNumber: number };

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [newMaintenanceRequests, setNewMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [newRequestCourtId, setNewRequestCourtId] = useState('');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [newRequestSeverity, setNewRequestSeverity] = useState('medium');
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [newIncidentSummary, setNewIncidentSummary] = useState('');
  const [newIncidentLocation, setNewIncidentLocation] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState('Low');
  const [isCreatingIncident, setIsCreatingIncident] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  // Inventory management state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [newInventoryName, setNewInventoryName] = useState('');
  const [newInventoryCount, setNewInventoryCount] = useState('');
  const [newInventoryCondition, setNewInventoryCondition] = useState('Good');
  const [isCreatingInventory, setIsCreatingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Task management state
  const [orgTasks, setOrgTasks] = useState<Task[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Recruit staff state
  const [spectators, setSpectators] = useState<any[]>([]);
  const [isLoadingSpectators, setIsLoadingSpectators] = useState(false);
  const [spectatorSearchDraft, setSpectatorSearchDraft] = useState('');
  const [spectatorSearch, setSpectatorSearch] = useState('');
  const [spectatorCache, setSpectatorCache] = useState<Record<string, any[]>>({});
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [selectedSpectator, setSelectedSpectator] = useState<any>(null);
  const [recruitRole, setRecruitRole] = useState('coach');
  const [recruitExpertise, setRecruitExpertise] = useState('');
  const [recruitCoachingLevel, setRecruitCoachingLevel] = useState('');
  const [recruitExperience, setRecruitExperience] = useState('');
  const [recruitContact, setRecruitContact] = useState('');
  const [isRecruiting, setIsRecruiting] = useState(false);

  const reportSectionRef = useRef<HTMLDivElement | null>(null);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReportDownloading, setIsReportDownloading] = useState(false);

  const searchTimeoutRef = React.useRef<number | null>(null);

  const roleLabel = dashboardData?.manager?.role || 'Platform Admin';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadDashboard = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await authenticatedFetch(`/api/dashboard/role?role=admin&userId=${user.id}`);
      const json = await res.json() as AdminDashboardData & { error?: string };

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load dashboard');
      }

      setDashboardData(json);
      addToast('Admin dashboard loaded successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addToast(`Unable to load dashboard: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!dashboardData?.organizationId) {
      setIncidentError('Organization not loaded');
      return;
    }

    if (!newIncidentSummary.trim() || !newIncidentLocation.trim()) {
      setIncidentError('Summary and location are required');
      return;
    }

    setIncidentError(null);
    setIsCreatingIncident(true);

    try {
      const res = await authenticatedFetch(`/api/organization/${dashboardData.organizationId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newIncidentSummary,
          location: newIncidentLocation,
          severity: newIncidentSeverity,
          reportedById: user?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create incident');
      }

      setNewIncidentSummary('');
      setNewIncidentLocation('');
      setNewIncidentSeverity('Low');
      setIsIncidentModalOpen(false);
      setIncidentError(null);
      addToast('Incident reported successfully', 'success');
      
      // Update the incidents list with the newly created incident
      setDashboardData(prev => prev ? {
        ...prev,
        incidents: [json, ...(prev.incidents ?? [])]
      } : null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setIncidentError(message);
      addToast(`Could not report incident: ${message}`, 'error');
    } finally {
      setIsCreatingIncident(false);
    }
  };

  const handleCreateInventoryItem = async () => {
    if (!dashboardData?.organizationId) {
      setInventoryError('Organization not loaded');
      return;
    }

    if (!newInventoryName.trim()) {
      setInventoryError('Item name is required');
      return;
    }

    setInventoryError(null);
    setIsCreatingInventory(true);

    try {
      const res = await authenticatedFetch(`/api/organization/${dashboardData.organizationId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInventoryName,
          count: newInventoryCount ? parseInt(newInventoryCount) : 0,
          condition: newInventoryCondition,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create inventory item');
      }

      setNewInventoryName('');
      setNewInventoryCount('');
      setNewInventoryCondition('Good');
      setIsInventoryModalOpen(false);
      setInventoryError(null);
      addToast('Inventory item added successfully', 'success');
      
      // Update the inventory list with the newly created item
      const mappedItem = {
        id: json.id,
        item: json.name,
        quantity: json.count,
        unit: '',
        status: json.condition === 'Good' ? 'Adequate' : 'Low'
      };
      setDashboardData(prev => prev ? {
        ...prev,
        inventory: [mappedItem, ...(prev.inventory ?? [])]
      } : null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setInventoryError(message);
      addToast(`Could not add inventory item: ${message}`, 'error');
    } finally {
      setIsCreatingInventory(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id, addToast]);

  // Load staff members for task assignment
  useEffect(() => {
    const loadStaff = async () => {
      const orgId = dashboardData?.organizationId || dashboardData?.manager?.organizationId;
      if (!orgId) return;
      try {
        const res = await authenticatedFetch(`/api/organization/${orgId}/staff`);
        if (!res.ok) throw new Error('Failed to load staff');
        const data = await res.json();
        
        // Staff endpoint returns array directly
        const staffArray = Array.isArray(data) ? data : (data.staff ?? []);
        
        const staffList = staffArray.map((s: any) => ({
          id: s.id || s.userId,
          userId: s.id || s.userId,
          name: s.name || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || s.email || 'Unknown',
          role: s.role || 'Staff',
          department: s.expertise || s.coachingLevel || 'General',
          status: s.status || (s.isActive ? 'Active' : 'Inactive'),
          attendance: '0%',
          email: s.email || s.user?.email || '',
        }));
        
        console.log('Loaded staff:', staffList);
        setAllStaff(staffList);
      } catch (err) {
        console.error('Failed to load staff for task assignment:', err);
        addToast('Failed to load staff members', 'error');
      }
    };

    loadStaff();
  }, [dashboardData?.organizationId, dashboardData?.manager?.organizationId, addToast]);

  // Load tasks for the organization
  useEffect(() => {
    const loadTasks = async () => {
      const orgId = dashboardData?.organizationId || dashboardData?.manager?.organizationId;
      if (!orgId) return;
      setIsLoadingTasks(true);
      try {
        const res = await authenticatedFetch(`/api/organization/${orgId}/tasks?limit=100&offset=0`);
        if (!res.ok) throw new Error('Failed to load tasks');
        const data = await res.json() as { tasks?: Task[] };
        const tasks = data.tasks ?? [];
        console.log('Loaded tasks:', tasks);
        setOrgTasks(tasks);
      } catch (err) {
        console.error('Failed to load organization tasks:', err);
        addToast('Failed to load tasks', 'error');
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasks();
  }, [dashboardData?.organizationId, dashboardData?.manager?.organizationId, addToast]);

  // Load spectators when recruit section is active or the committed search query changes
  useEffect(() => {
    if (sectionParam === 'recruit') {
      loadSpectators(spectatorSearch);
    }
  }, [sectionParam, spectatorSearch, dashboardData?.organizationId, dashboardData?.manager?.organizationId]);

  useEffect(() => {
    if (sectionParam === 'reports') {
      loadReportSummary();
    }
  }, [sectionParam, dashboardData?.organizationId, dashboardData?.manager?.organizationId]);

  useEffect(() => {
    const loadCourts = async () => {
      if (!dashboardData?.organizationId) return;
      try {
        const res = await authenticatedFetch(`/api/organization/${dashboardData.organizationId}/courts`);
        if (!res.ok) throw new Error('Failed to load courts');
        const data = await res.json() as { courts?: CourtOption[] };
        const courtList = data.courts ?? [];
        setCourts(courtList);
        setNewRequestCourtId(current => current || courtList[0]?.id || '');
      } catch (err) {
        console.error('Failed to load courts for maintenance request:', err);
      }
    };

    loadCourts();
  }, [dashboardData?.organizationId]);

  const maintenanceRequests = [
    ...(dashboardData?.maintenanceRequests ?? [
      { id: 'm-1', facility: 'Court 6', issue: 'Broken lighting', status: 'In Progress', reportedDate: '2026-05-12' },
      { id: 'm-2', facility: 'Court 3', issue: 'Water supply issue', status: 'Pending', reportedDate: '2026-05-13' },
      { id: 'm-3', facility: 'Admin Office', issue: 'AC not working', status: 'Completed', reportedDate: '2026-05-11' },
    ]),
    ...newMaintenanceRequests,
  ];

  // Operational Data
  const operationalStats = dashboardData?.operationalStats ?? {
    activeStaff: 24,
    pendingTasks: 8,
    maintenanceAlerts: 3,
    recentIncidents: 2,
    attendanceToday: '92%',
  };

  const staffList = dashboardData?.staff ?? [
    { id: '1', name: 'John Smith', role: 'Finance Officer', department: 'Finance', status: 'Active', attendance: '95%' },
    { id: '2', name: 'Sarah Johnson', role: 'Receptionist', department: 'Reception', status: 'Active', attendance: '98%' },
    { id: '3', name: 'Mike Davis', role: 'Maintenance Manager', department: 'Maintenance', status: 'Active', attendance: '88%' },
  ];

  const departments = dashboardData?.departments ?? [
    { name: 'Finance', staffCount: 3, status: 'Operational', performance: '95%' },
    { name: 'Reception', staffCount: 2, status: 'Operational', performance: '98%' },
    { name: 'Maintenance', staffCount: 4, status: 'Operational', performance: '87%' },
    { name: 'Security', staffCount: 5, status: 'Operational', performance: '91%' },
  ];

  const pendingTasks = dashboardData?.pendingTasks ?? [
    { id: '1', title: 'Court 3 Maintenance', assignee: 'Mike Davis', priority: 'High', dueDate: '2026-05-14' },
    { id: '2', title: 'Staff Schedule Review', assignee: 'Admin', priority: 'Medium', dueDate: '2026-05-15' },
    { id: '3', title: 'Inventory Check', assignee: 'Jane Doe', priority: 'Low', dueDate: '2026-05-16' },
  ];

  const handleCreateMaintenanceRequest = async () => {
    if (!dashboardData?.organizationId || !newRequestCourtId || !newRequestTitle || !newRequestDescription) {
      addToast('Please complete all fields before submitting.', 'warning');
      return;
    }

    setIsCreatingRequest(true);

    try {
      const res = await authenticatedFetch(
        `/api/organization/${dashboardData.organizationId}/courts/${newRequestCourtId}/complaints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newRequestTitle,
            description: newRequestDescription,
            severity: newRequestSeverity,
            category: 'maintenance',
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Unable to create maintenance request');
      }

      const created = json.complaint;
      setNewMaintenanceRequests(prev => [
        {
          id: created.id,
          facility: `${created.court?.name ?? 'Court'} #${created.court?.courtNumber ?? ''}`,
          issue: created.title,
          status: created.status,
          reportedDate: new Date(created.createdAt).toLocaleDateString(),
        },
        ...prev,
      ]);

      setIsCreateRequestOpen(false);
      setNewRequestTitle('');
      setNewRequestDescription('');
      setNewRequestSeverity('medium');
      addToast('Maintenance request created successfully.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Failed to create maintenance request: ${message}`, 'error');
      console.error('Create maintenance request error:', err);
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const handleAssignTask = async () => {
    if (!dashboardData?.organizationId || !newTaskTitle || !newTaskAssignee) {
      addToast('Please complete required fields (Title and Assignee).', 'warning');
      return;
    }

    setIsAssigningTask(true);

    try {
      const res = await authenticatedFetch(
        `/api/organization/${dashboardData.organizationId}/tasks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffUserId: newTaskAssignee,
            title: newTaskTitle,
            description: newTaskDescription,
            role: 'Staff',
            priority: newTaskPriority,
            dueDate: newTaskDueDate || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Unable to assign task');
      }

      // Add the new task to the list
      const assignedStaff = allStaff.find(s => (s.userId || s.id) === newTaskAssignee);
      setOrgTasks(prev => [{
        id: json.task?.id || 'new-' + Date.now(),
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'pending',
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        assignedTo: assignedStaff ? { 
          id: assignedStaff.userId || assignedStaff.id, 
          name: assignedStaff.name, 
          email: assignedStaff.email || '', 
          role: assignedStaff.role 
        } : null,
        createdAt: new Date().toISOString(),
      }, ...prev]);

      setIsAssignTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      addToast('Task assigned successfully.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Failed to assign task: ${message}`, 'error');
      console.error('Assign task error:', err);
    } finally {
      setIsAssigningTask(false);
    }
  };

  // Load spectators for recruitment
  const loadSpectators = async (search = '') => {
    const orgId = dashboardData?.organizationId || dashboardData?.manager?.organizationId;
    if (!orgId) return;

    const cacheKey = search.trim().toLowerCase();
    if (cacheKey in spectatorCache) {
      setSpectators(spectatorCache[cacheKey]);
      return;
    }

    setIsLoadingSpectators(true);
    try {
      const res = await authenticatedFetch(
        `/api/organization/${orgId}/spectators?search=${encodeURIComponent(search)}&limit=50&offset=0`
      );
      if (!res.ok) throw new Error('Failed to load spectators');
      const data = await res.json();
      const list = data.spectators || [];
      setSpectators(list);
      setSpectatorCache(prev => ({ ...prev, [cacheKey]: list }));
    } catch (err) {
      console.error('Failed to load spectators:', err);
      addToast('Failed to load spectators', 'error');
    } finally {
      setIsLoadingSpectators(false);
    }
  };

  // Handle spectator search input draft
  const handleSpectatorSearchDraft = (searchTerm: string) => {
    setSpectatorSearchDraft(searchTerm);

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setSpectatorSearch(searchTerm);
    }, 20000);
  };

  const handleSpectatorSearchSubmit = () => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSpectatorSearch(spectatorSearchDraft);
  };

  // Handle recruit staff
  const handleRecruitStaff = async () => {
    if (!selectedSpectator || !recruitRole) {
      addToast('Please select a spectator and role.', 'warning');
      return;
    }

    setIsRecruiting(true);
    try {
      const orgId = dashboardData?.organizationId || dashboardData?.manager?.organizationId;
      const res = await authenticatedFetch(`/api/organization/${orgId}/recruit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSpectator.userId,
          role: recruitRole,
          expertise: recruitExpertise || null,
          coachingLevel: recruitCoachingLevel || null,
          yearsOfExperience: parseInt(recruitExperience) || 0,
          contact: recruitContact || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to recruit staff');
      }

      // Remove the recruited spectator from the list
      setSpectators(prev => prev.filter(s => s.userId !== selectedSpectator.userId));

      // Close modal and reset form
      setIsRecruitModalOpen(false);
      setSelectedSpectator(null);
      setRecruitRole('coach');
      setRecruitExpertise('');
      setRecruitCoachingLevel('');
      setRecruitExperience('');
      setRecruitContact('');

      addToast('Staff member recruited successfully! Notification queued via Kafka.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Failed to recruit staff: ${message}`, 'error');
      console.error('Recruit staff error:', err);
    } finally {
      setIsRecruiting(false);
    }
  };

  const formatReportDate = (value?: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return value;
    }
  };

  const formatActivityDetails = (details: any) => {
    if (!details) return '';
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        if (typeof parsed === 'object') {
          return Object.entries(parsed)
            .slice(0, 4)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(' · ');
        }
      } catch {
        return details;
      }
    }

    if (typeof details === 'object') {
      return Object.entries(details)
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(' · ');
    }

    return String(details);
  };

  const loadReportSummary = async () => {
    const orgId = dashboardData?.organizationId || dashboardData?.manager?.organizationId;
    if (!orgId) return;

    setIsLoadingReport(true);
    setReportError(null);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/report-summary`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load report summary');
      }
      setReportSummary(json);
      addToast('Organization report summary loaded.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load reports';
      setReportError(message);
      addToast(`Failed to load reports: ${message}`, 'error');
      console.error('Report summary error:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportSectionRef.current) {
      addToast('Report preview is not ready yet.', 'warning');
      return;
    }

    setIsReportDownloading(true);
    try {
      await downloadReportPdf(reportSectionRef.current, {
        filename: `organization-report-${dashboardData?.organizationId ?? 'summary'}.pdf`,
        reportTitle: 'Organization Activity Summary',
        reportDescription: 'Full log of recent events, tournaments, bookings, payments, memberships, and staff activity.',
        reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        orientation: 'portrait',
        format: 'a4',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export report';
      console.error('PDF export error:', err);
      addToast(message, 'error');
    } finally {
      setIsReportDownloading(false);
    }
  };

  const incidents = dashboardData?.incidents ?? [
    { id: 'inc-1', type: 'Complaint', description: 'Unhappy with service', status: 'Open', reportedBy: 'Member', date: '2026-05-13' },
    { id: 'inc-2', type: 'Warning', description: 'Staff late to shift', status: 'Resolved', reportedBy: 'Manager', date: '2026-05-12' },
  ];

  const inventory = dashboardData?.inventory ?? [
    { id: 'inv-1', item: 'Tennis Balls', quantity: 150, unit: 'boxes', status: 'Adequate' },
    { id: 'inv-2', item: 'Court Markings', quantity: 5, unit: 'sets', status: 'Low' },
    { id: 'inv-3', item: 'Safety Equipment', quantity: 45, unit: 'items', status: 'Adequate' },
  ];

  if (isLoading) {
    return <LoadingState icon="⚙️" message="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <DashboardErrorPage
        error={error}
        title="Admin Dashboard Error"
        icon="⚙️"
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row" style={{ height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: G.dark, color: G.text, overflow: 'hidden' }}>

      <div className="md:hidden sticky top-0 z-20 bg-[#0f1f0f] border-b border-[#2d5a35] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎾</span>
            <div>
              <div className="text-[11px] font-semibold text-[#e8f5e0]">Vico Tennis</div>
              <div className="text-[10px] text-[#7aaa6a]">Organization Operations</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-[#2d5a35] px-3 py-2 text-xs font-semibold text-[#7aaa6a] hover:bg-[#1e3a20] transition"
          >
            ☰ Menu
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] transform border-r transition-transform duration-300 md:relative md:sticky md:top-0 md:translate-x-0 md:flex md:w-56 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: G.sidebar, borderRight: `1px solid ${G.cardBorder}`, flexDirection: 'column', flexShrink: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ padding: '15px 14px 10px', borderBottom: `1px solid ${G.cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <div style={{ color: G.lime, fontWeight: 900, fontSize: 14 }}>Vico Tennis</div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto inline-flex items-center justify-center rounded-xl border border-[#2d5a35] px-2 py-2 text-xs font-semibold text-[#7aaa6a] hover:bg-[#1e3a20] transition"
          >
            ✕
          </button>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => handleNavigation(item.section)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px',
              background: activeNav === item.label ? G.mid : 'transparent',
              color: activeNav === item.label ? '#fff' : G.muted,
              border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
              borderLeft: activeNav === item.label ? `3px solid ${G.lime}` : '3px solid transparent',
            }}><span>{item.icon}</span>{item.label}</button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Profile Card at Bottom */}
        <div style={{ padding: '10px 12px 14px', flexShrink: 0 }}>
          <div style={{ background: G.mid, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          {user?.photo
            ? <img src={user.photo} alt={user.firstName} style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${G.lime}`, objectFit: 'cover', marginBottom: 6 }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: G.bright, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛡️</div>}
          <div style={{ fontWeight: 800, fontSize: 11, marginTop: 4 }}>{user?.firstName ?? 'Admin'} {user?.lastName || ''}</div>
          <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{roleLabel}</div>
          {user?.email && <div style={{ fontSize: 8, color: G.muted, marginTop: 2, wordBreak: 'break-word' }}>📧 {user.email}</div>}
          <div style={{ marginTop: 8 }}>
            <MembershipSwitcher />
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <button 
              onClick={() => router.push('/admin/profile')}
              style={{ flex: 1, background: G.dark, color: G.lime, border: `1px solid ${G.lime}`, borderRadius: 6, padding: '4px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Edit
            </button>
            <button 
              onClick={handleLogout}
              style={{ flex: 1, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 0', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Organization Operations Manager</h1>
            <p style={{ margin: '4px 0 0', color: G.muted, fontSize: 11 }}>Role: {roleLabel}</p>
          </div>
          <div style={{ color: G.muted, fontSize: 11 }}>Active section: {activeNav}</div>
        </div>

        {activeNav === 'Overview' && (
          <>
            {/* OVERVIEW STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-6">
              {[
                { label: 'Active Staff', value: operationalStats.activeStaff, icon: '👥' },
                { label: 'Pending Tasks', value: operationalStats.pendingTasks, icon: '✓' },
                { label: 'Maintenance Alerts', value: operationalStats.maintenanceAlerts, icon: '🚨' },
                { label: 'Recent Incidents', value: operationalStats.recentIncidents, icon: '⚠️' },
                { label: 'Attendance Today', value: operationalStats.attendanceToday, icon: '📅' },
              ].map((card, i) => (
                <div key={i} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, color: G.muted, marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: G.accent }}>{card.icon} {card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginTop: 10 }}>
              <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>👥 Active Staff</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {staffList?.length ? staffList.slice(0, 5).map((member, index: number) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, background: '#0f1f0f', borderRadius: 10, border: `1px solid ${G.cardBorder}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{member.name}</div>
                        <div style={{ fontSize: 10, color: G.muted }}>{member.role} • {member.department}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: G.lime }}>{member.attendance}</div>
                        <div style={{ fontSize: 9, color: G.muted }}>Attendance</div>
                      </div>
                    </div>
                  )) : <div style={{ fontSize: 11, color: G.muted }}>No staff members yet.</div>}
                </div>
              </section>

              <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚙️ Departments Overview</div>
                {departments?.length ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {departments.map((dept, index: number) => (
                      <div key={index} style={{ padding: 10, background: '#0f1f0f', borderRadius: 10, border: `1px solid ${G.cardBorder}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{dept.name}</div>
                            <div style={{ fontSize: 10, color: G.muted }}>{dept.staffCount} staff</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: G.lime }}>{dept.performance}</div>
                            <div style={{ fontSize: 9, color: G.muted }}>Performance</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: G.muted }}>No departments found.</div>
                )}
              </section>
            </div>
          </>
        )}

        {activeNav === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📋 Pending Tasks</div>
              {pendingTasks?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {pendingTasks.map((task, i: number) => (
                    <div key={i} style={{ padding: 10, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{task.title}</div>
                          <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>Assigned to: {task.assignee}</div>
                        </div>
                        <span style={{ background: task.priority === 'High' ? '#e57373' : task.priority === 'Medium' ? G.yellow : G.lime, color: '#0f1f0f', padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700 }}>{task.priority}</span>
                      </div>
                      <div style={{ fontSize: 9, color: G.muted, marginTop: 6 }}>Due: {task.dueDate}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 11, color: G.muted }}>No pending tasks.</div>}
            </section>

            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🚨 Maintenance Alerts</div>
              {maintenanceRequests?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {maintenanceRequests.slice(0, 3).map((req, i: number) => (
                    <div key={i} style={{ padding: 10, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{req.facility}</div>
                          <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>{req.issue}</div>
                        </div>
                        <span style={{ background: req.status === 'In Progress' ? G.yellow : req.status === 'Completed' ? G.lime : '#e57373', color: '#0f1f0f', padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700 }}>{req.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 11, color: G.muted }}>No maintenance requests.</div>}
            </section>
          </div>
        )}

        {activeNav === 'Staff' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👥 Staff Management</span>
              <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add Staff</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${G.cardBorder}` }}>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Department</th>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Attendance</th>
                    <th style={{ textAlign: 'left', padding: 8, color: G.muted, fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList?.length ? staffList.map((staff, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.cardBorder}33` }}>
                      <td style={{ padding: 10 }}>{staff.name}</td>
                      <td style={{ padding: 10 }}>{staff.role}</td>
                      <td style={{ padding: 10 }}>{staff.department}</td>
                      <td style={{ padding: 10 }}><span style={{ background: G.lime, color: '#0f1f0f', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{staff.status}</span></td>
                      <td style={{ padding: 10, color: G.lime }}>{staff.attendance}</td>
                      <td style={{ padding: 10 }}><button style={{ background: G.mid, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 4, padding: '4px 8px', fontSize: 9, cursor: 'pointer' }}>Edit</button></td>
                    </tr>
                  )) : <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: G.muted }}>No staff members</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeNav === 'Tasks' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✓ Task Management</span>
                {isLoadingTasks && <span style={{ fontSize: 9, color: G.muted }}>Loading tasks...</span>}
                {!isLoadingTasks && orgTasks.length > 0 && <span style={{ fontSize: 9, color: G.lime, fontWeight: 700 }}>({orgTasks.length} total)</span>}
              </div>
              <button onClick={() => setIsAssignTaskOpen(true)} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ Assign Task</button>
            </div>

            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                onClick={() => setTaskStatusFilter('all')}
                style={{ background: taskStatusFilter === 'all' ? G.lime : G.mid, color: taskStatusFilter === 'all' ? '#0f1f0f' : G.text, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >All Tasks ({orgTasks.length})</button>
              <button 
                onClick={() => setTaskStatusFilter('pending')}
                style={{ background: taskStatusFilter === 'pending' ? G.lime : G.mid, color: taskStatusFilter === 'pending' ? '#0f1f0f' : G.text, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >Pending ({orgTasks.filter(t => t.status === 'pending').length})</button>
              <button 
                onClick={() => setTaskStatusFilter('in_progress')}
                style={{ background: taskStatusFilter === 'in_progress' ? G.lime : G.mid, color: taskStatusFilter === 'in_progress' ? '#0f1f0f' : G.text, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >In Progress ({orgTasks.filter(t => t.status === 'in_progress').length})</button>
              <button 
                onClick={() => setTaskStatusFilter('completed')}
                style={{ background: taskStatusFilter === 'completed' ? G.lime : G.mid, color: taskStatusFilter === 'completed' ? '#0f1f0f' : G.text, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
              >Completed ({orgTasks.filter(t => t.status === 'completed').length})</button>
            </div>

            {isLoadingTasks ? (
              <div style={{ fontSize: 11, color: G.muted, padding: 20, textAlign: 'center' }}>Loading tasks...</div>
            ) : orgTasks.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {orgTasks
                  .filter(task => taskStatusFilter === 'all' || task.status === taskStatusFilter)
                  .map((task, i: number) => (
                    <div key={i} style={{ padding: 12, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{task.title}</div>
                          {task.description && <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>{task.description}</div>}
                        </div>
                        <span style={{ background: task.priority === 'high' ? '#e57373' : task.priority === 'medium' ? G.yellow : G.lime, color: '#0f1f0f', padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap' }}>{(task.priority || 'normal').toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: G.muted, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                          {task.dueDate && <span style={{ marginLeft: 12 }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                        <span style={{ background: task.status === 'completed' ? G.lime : task.status === 'in_progress' ? G.yellow : task.status === 'pending' ? '#888' : '#666', color: '#0f1f0f', padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontSize: 8 }}>{(task.status || 'unknown').toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: G.muted, padding: 20, textAlign: 'center' }}>No tasks assigned yet. Click "+ Assign Task" to create one.</div>
            )}
          </div>
        )}

        {activeNav === 'Operations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚙️ Daily Operations</div>
              <div style={{ fontSize: 10, color: G.muted, lineHeight: 1.6 }}>
                <p>• Staff on duty: 24 members</p>
                <p>• Operational courts: 8/10</p>
                <p>• Pending bookings: 12</p>
                <p>• Member check-ins: 156 today</p>
                <p>• Facility status: Fully operational</p>
              </div>
            </section>

            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📊 Task Assignments</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {pendingTasks?.slice(0, 3).map((task, i: number) => (
                  <div key={i} style={{ padding: 8, background: '#0f1f0f', borderRadius: 6, border: `1px solid ${G.cardBorder}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{task.title}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{task.assignee}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeNav === 'Maintenance' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔧 Maintenance Requests</span>
              <button onClick={() => setIsCreateRequestOpen(true)} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ New Request</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {maintenanceRequests?.length ? maintenanceRequests.map((req, i: number) => (
                <div key={i} style={{ padding: 12, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}`, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{req.facility}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>{req.issue}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>Reported: {req.reportedDate}</div>
                  </div>
                  <span style={{ background: req.status === 'In Progress' ? G.yellow : req.status === 'Completed' ? G.lime : '#e57373', color: '#0f1f0f', padding: '4px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, textAlign: 'center' }}>{req.status}</span>
                  <button style={{ background: G.mid, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 4, padding: '4px 8px', fontSize: 9, cursor: 'pointer' }}>Update</button>
                </div>
              )) : <div style={{ fontSize: 11, color: G.muted }}>No maintenance requests</div>}
            </div>
          </div>
        )}

        {isCreateRequestOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ width: 'min(560px, 90vw)', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 24, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Create Maintenance Request</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Submit a new court or facility issue for maintenance.</div>
                </div>
                <button onClick={() => setIsCreateRequestOpen(false)} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Court / Facility</label>
                <select value={newRequestCourtId} onChange={e => setNewRequestCourtId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}>
                  {courts.length ? courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name} #{court.courtNumber}</option>
                  )) : <option value="">No courts available</option>}
                </select>

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Issue Title</label>
                <input value={newRequestTitle} onChange={e => setNewRequestTitle(e.target.value)} placeholder="Broken light, leaking pipe, etc." style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Description</label>
                <textarea value={newRequestDescription} onChange={e => setNewRequestDescription(e.target.value)} rows={4} placeholder="Describe the issue and where it appears." style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Severity</label>
                <select value={newRequestSeverity} onChange={e => setNewRequestSeverity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setIsCreateRequestOpen(false)} style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreateMaintenanceRequest} disabled={isCreatingRequest} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: isCreatingRequest ? 'not-allowed' : 'pointer' }}>{isCreatingRequest ? 'Creating…' : 'Create Request'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAssignTaskOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ width: 'min(560px, 90vw)', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 24, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Assign Task to Staff</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Create a new task and assign it to coaches, referees, or staff members.</div>
                </div>
                <button onClick={() => setIsAssignTaskOpen(false)} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Task Title *</label>
                  <input 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="e.g., Court Inspection, Equipment Check, etc." 
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Description</label>
                  <textarea 
                    value={newTaskDescription} 
                    onChange={e => setNewTaskDescription(e.target.value)} 
                    rows={3} 
                    placeholder="Provide details about the task..." 
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Assign To *</label>
                  <select 
                    value={newTaskAssignee} 
                    onChange={e => setNewTaskAssignee(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                  >
                    <option value="">
                      {allStaff.length === 0 ? 'Loading staff...' : 'Select a staff member...'}
                    </option>
                    {allStaff.length > 0 ? allStaff.map(staff => (
                      <option key={staff.userId} value={staff.userId || staff.id}>
                        {staff.name} ({staff.role})
                      </option>
                    )) : null}
                  </select>
                  {allStaff.length === 0 && <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>No staff members available in this organization</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Priority</label>
                    <select 
                      value={newTaskPriority} 
                      onChange={e => setNewTaskPriority(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Due Date</label>
                    <input 
                      type="date" 
                      value={newTaskDueDate} 
                      onChange={e => setNewTaskDueDate(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setIsAssignTaskOpen(false)} style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAssignTask} disabled={isAssigningTask} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: isAssigningTask ? 'not-allowed' : 'pointer' }}>{isAssigningTask ? 'Assigning…' : 'Assign Task'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'Recruit Staff' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎯 Staff Recruitment</span>
                {isLoadingSpectators && <span style={{ fontSize: 9, color: G.muted }}>Loading spectators...</span>}
                {!isLoadingSpectators && spectators.length > 0 && <span style={{ fontSize: 9, color: G.lime, fontWeight: 700 }}>({spectators.length} available)</span>}
              </div>
            </div>

            <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <input
                type="text"
                placeholder="Search spectators by name, email, or username..."
                value={spectatorSearchDraft}
                onChange={(e) => handleSpectatorSearchDraft(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text, fontSize: 11 }}
              />
              <button
                onClick={handleSpectatorSearchSubmit}
                style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Search
              </button>
            </div>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 12 }}>Type and wait briefly, or click Search to query spectators.</div>

            {isLoadingSpectators ? (
              <div style={{ fontSize: 11, color: G.muted, padding: 20, textAlign: 'center' }}>Loading spectators...</div>
            ) : spectators.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {spectators.map((spectator, i: number) => (
                  <div key={i} style={{ padding: 12, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{spectator.name}</div>
                        <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{spectator.email}</div>
                        {spectator.location && <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>📍 {spectator.location}</div>}
                        <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>Joined: {new Date(spectator.registeredAt).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSpectator(spectator);
                          setIsRecruitModalOpen(true);
                        }}
                        style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Recruit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: G.muted, padding: 20, textAlign: 'center' }}>
                {spectatorSearch ? 'No spectators found matching your search.' : 'No spectators available for recruitment.'}
              </div>
            )}
          </div>
        )}

        {isRecruitModalOpen && selectedSpectator && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ width: 'min(560px, 90vw)', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 24, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Recruit Staff Member</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Promote {selectedSpectator.name} to staff role</div>
                </div>
                <button onClick={() => setIsRecruitModalOpen(false)} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ padding: 12, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{selectedSpectator.name}</div>
                  <div style={{ fontSize: 9, color: G.muted }}>{selectedSpectator.email}</div>
                  {selectedSpectator.location && <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>📍 {selectedSpectator.location}</div>}
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Role</label>
                <select
                  value={recruitRole}
                  onChange={e => setRecruitRole(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                >
                  <option value="coach">Coach</option>
                  <option value="referee">Referee</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Expertise (Optional)</label>
                <input
                  value={recruitExpertise}
                  onChange={e => setRecruitExpertise(e.target.value)}
                  placeholder="e.g., Tennis Coaching, Court Maintenance"
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Coaching Level (Optional)</label>
                    <select
                      value={recruitCoachingLevel}
                      onChange={e => setRecruitCoachingLevel(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                    >
                      <option value="">Select level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Years Experience</label>
                    <input
                      type="number"
                      value={recruitExperience}
                      onChange={e => setRecruitExperience(e.target.value)}
                      placeholder="0"
                      min="0"
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                    />
                  </div>
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: G.lime }}>Contact Info (Optional)</label>
                <input
                  value={recruitContact}
                  onChange={e => setRecruitContact(e.target.value)}
                  placeholder="Phone number or additional contact info"
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setIsRecruitModalOpen(false)} style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleRecruitStaff} disabled={isRecruiting} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: isRecruiting ? 'not-allowed' : 'pointer' }}>{isRecruiting ? 'Recruiting…' : 'Recruit Staff'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'Reports' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>📈 Organization Activity Report</div>
                <div style={{ fontSize: 11, color: G.muted, lineHeight: 1.7, maxWidth: 700 }}>
                  Review the latest events, tournaments, bookings, payments, memberships, and operational activity in one place. Export a polished PDF summary for leadership review.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isLoadingReport || !reportSummary || isReportDownloading}
                data-pdf-ignore
                style={{ minWidth: 180, background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: isLoadingReport || isReportDownloading ? 'not-allowed' : 'pointer' }}
              >
                {isReportDownloading ? 'Exporting PDF…' : 'Download Report PDF'}
              </button>
            </div>

            {isLoadingReport ? (
              <div style={{ padding: 20, background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12 }}>Loading report data…</div>
            ) : reportError ? (
              <div style={{ padding: 16, background: '#2b1f1f', border: '1px solid #702020', borderRadius: 10, color: '#f5a7a7' }}>
                {reportError}
              </div>
            ) : (
              <div ref={reportSectionRef} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Total Members', value: reportSummary?.counts?.totalMembers ?? '—', icon: '👥' },
                    { label: 'Active Staff', value: reportSummary?.counts?.activeStaffCount ?? '—', icon: '🧑‍🏫' },
                    { label: 'Staff Total', value: reportSummary?.counts?.totalStaffCount ?? '—', icon: '👨‍👩‍👧‍👦' },
                    { label: 'Pending Tasks', value: reportSummary?.counts?.pendingTaskCount ?? '—', icon: '⏳' },
                    { label: 'Completed Tasks', value: reportSummary?.counts?.completedTaskCount ?? '—', icon: '✅' },
                    { label: 'Events & Tournaments', value: `${reportSummary?.counts?.eventCount ?? '—'} total • ${reportSummary?.counts?.tournamentCount ?? '—'} tournaments`, icon: '🎟️' },
                    { label: 'Recent Bookings', value: reportSummary?.counts?.recentBookings ?? '—', icon: '📅' },
                    { label: 'Recent Payments', value: reportSummary?.totals?.recentRevenue != null ? `$${reportSummary.totals.recentRevenue.toLocaleString()}` : '—', icon: '💰' },
                  ].map((summary, index) => (
                    <div key={index} style={{ padding: 14, background: G.card, borderRadius: 12, border: `1px solid ${G.cardBorder}` }}>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>{summary.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{summary.icon}</span>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{summary.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📰 Recent Activity</div>
                    {reportSummary?.recentActivities?.length ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {reportSummary.recentActivities.map((activity: any, index: number) => (
                          <div key={index} style={{ padding: 14, background: '#0a1810', borderRadius: 12, border: `1px solid ${G.cardBorder}`, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>✓ {activity.action?.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 11, color: G.muted }}>By <span style={{ color: G.text, fontWeight: 500 }}>{activity.player?.name || 'Unknown'}</span></div>
                              </div>
                              <div style={{ fontSize: 10, color: G.muted, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatReportDate(activity.createdAt)}</div>
                            </div>
                            {activity.details && (
                              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${G.cardBorder}` }}>
                                <div style={{ fontSize: 9, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Details</div>
                                <div style={{ fontSize: 11, color: G.text, lineHeight: 1.6, display: 'grid', gap: 5 }}>
                                  {typeof activity.details === 'object' ? Object.entries(activity.details).map(([key, value]: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                                      <span style={{ color: G.muted, minWidth: '120px' }}>{key.replace(/_/g, ' ')}:</span>
                                      <span style={{ color: G.text, fontWeight: 500, wordBreak: 'break-word' }}>{String(value)}</span>
                                    </div>
                                  )) : (
                                    <div>{formatActivityDetails(activity.details)}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: G.muted }}>No recent activity to display.</div>
                    )}
                  </section>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🎾 Recent Bookings</div>
                      {reportSummary?.recentBookings?.length ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {reportSummary.recentBookings.map((booking: any, index: number) => (
                            <div key={index} style={{ padding: 10, background: '#0f1f0f', borderRadius: 10, border: `1px solid ${G.cardBorder}` }}>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{booking.courtName}</div>
                              <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{booking.memberName}</div>
                              <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>{formatReportDate(booking.startTime)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: G.muted }}>No booking snapshots available.</div>
                      )}
                    </section>

                    <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📝 New Memberships</div>
                      {reportSummary?.newMemberships?.length ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {reportSummary.newMemberships.map((member: any, index: number) => (
                            <div key={index} style={{ padding: 10, background: '#0f1f0f', borderRadius: 10, border: `1px solid ${G.cardBorder}` }}>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{member.name || 'Member'}</div>
                              <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{member.tier}</div>
                              <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>{formatReportDate(member.joinDate)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: G.muted }}>No recent membership signups.</div>
                      )}
                    </section>
                  </div>
                </div>

                <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>💳 Recent Finance Data</div>
                  {reportSummary?.recentFinances?.length ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {reportSummary.recentFinances.map((finance: any, index: number) => (
                        <div key={index} style={{ padding: 10, background: '#0f1f0f', borderRadius: 10, border: `1px solid ${G.cardBorder}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{finance.month}/{finance.year}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: G.lime }}>${finance.totalAmount?.toLocaleString() ?? 0}</div>
                          </div>
                          <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>{finance.transactionCount} transactions</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: G.muted }}>No finance summary available.</div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {activeNav === 'Incidents' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ Incident Center</span>
              <button
                onClick={() => setIsIncidentModalOpen(true)}
                style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                + Report Incident
              </button>
            </div>

            {isIncidentModalOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                <div style={{ width: 'min(480px, 90vw)', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 24, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>Report Security Incident</div>
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Document and report security incidents for proper tracking and response.</div>
                    </div>
                    <button onClick={() => {
                      setIsIncidentModalOpen(false);
                      setIncidentError(null);
                      setNewIncidentSummary('');
                      setNewIncidentLocation('');
                      setNewIncidentSeverity('Low');
                    }} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Summary *</label>
                      <input
                        value={newIncidentSummary}
                        onChange={(e) => setNewIncidentSummary(e.target.value)}
                        placeholder="Brief description of the incident"
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Location *</label>
                      <input
                        value={newIncidentLocation}
                        onChange={(e) => setNewIncidentLocation(e.target.value)}
                        placeholder="Where did the incident occur?"
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Severity</label>
                      <select
                        value={newIncidentSeverity}
                        onChange={(e) => setNewIncidentSeverity(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    {incidentError && <div style={{ color: '#f49b8d', fontSize: 10, padding: 8, background: '#2d1b1b', borderRadius: 6 }}>{incidentError}</div>}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                      <button
                        onClick={() => {
                          setIsIncidentModalOpen(false);
                          setIncidentError(null);
                          setNewIncidentSummary('');
                          setNewIncidentLocation('');
                          setNewIncidentSeverity('Low');
                        }}
                        style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateIncident}
                        disabled={isCreatingIncident}
                        style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: isCreatingIncident ? 'not-allowed' : 'pointer' }}
                      >
                        {isCreatingIncident ? 'Reporting…' : 'Report Incident'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              {incidents?.length ? incidents.map((incident, i: number) => (
                <div key={i} style={{ padding: 12, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{incident.type}: {incident.description}</div>
                      <div style={{ fontSize: 9, color: G.muted, marginTop: 4 }}>Reported by: {incident.reportedBy} • {incident.date}</div>
                    </div>
                    <span style={{ background: incident.status === 'Resolved' ? G.lime : '#e57373', color: '#0f1f0f', padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{incident.status}</span>
                  </div>
                </div>
              )) : <div style={{ fontSize: 11, color: G.muted }}>No incidents reported</div>}
            </div>
          </div>
        )}

        {activeNav === 'Inventory' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📦 Inventory & Resources</span>
              <button onClick={() => setIsInventoryModalOpen(true)} style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add Item</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {inventory?.length ? inventory.map((item, i: number) => (
                <div key={i} style={{ padding: 10, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{item.item}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{item.quantity} {item.unit}</div>
                  </div>
                  <span style={{ background: item.status === 'Adequate' ? G.lime : '#e57373', color: '#0f1f0f', padding: '4px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{item.status}</span>
                </div>
              )) : <div style={{ fontSize: 11, color: G.muted }}>No items in inventory</div>}
            </div>

            {isInventoryModalOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                <div style={{ width: 'min(480px, 90vw)', background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 14, padding: 24, boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>Add Inventory Item</div>
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>Add a new item to your inventory.</div>
                    </div>
                    <button onClick={() => {
                      setIsInventoryModalOpen(false);
                      setInventoryError(null);
                      setNewInventoryName('');
                      setNewInventoryCount('');
                      setNewInventoryCondition('Good');
                    }} style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 18, cursor: 'pointer' }}>×</button>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Item Name *</label>
                      <input
                        value={newInventoryName}
                        onChange={(e) => setNewInventoryName(e.target.value)}
                        placeholder="e.g., Tennis Balls, Court Markings"
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Quantity</label>
                      <input
                        type="number"
                        value={newInventoryCount}
                        onChange={(e) => setNewInventoryCount(e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, color: G.lime }}>Condition</label>
                      <select
                        value={newInventoryCondition}
                        onChange={(e) => setNewInventoryCondition(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${G.cardBorder}`, background: '#122617', color: G.text }}
                      >
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    {inventoryError && <div style={{ color: '#f49b8d', fontSize: 10, padding: 8, background: '#2d1b1b', borderRadius: 6 }}>{inventoryError}</div>}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                      <button
                        onClick={() => {
                          setIsInventoryModalOpen(false);
                          setInventoryError(null);
                          setNewInventoryName('');
                          setNewInventoryCount('');
                          setNewInventoryCondition('Good');
                        }}
                        style={{ background: G.mid, color: G.text, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateInventoryItem}
                        disabled={isCreatingInventory}
                        style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: isCreatingInventory ? 'not-allowed' : 'pointer' }}
                      >
                        {isCreatingInventory ? 'Adding…' : 'Add Item'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeNav === 'Settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🔐 Admin Settings</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: 10, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Organization Name</div>
                  <input type="text" placeholder="Enter organization name" style={{ width: '100%', padding: 6, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text, fontSize: 10 }} />
                </div>
                <div style={{ padding: 10, background: '#0f1f0f', borderRadius: 8, border: `1px solid ${G.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Contact Email</div>
                  <input type="email" placeholder="admin@organization.com" style={{ width: '100%', padding: 6, background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 4, color: G.text, fontSize: 10 }} />
                </div>
                <button style={{ background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </section>

            <section style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>⚠️ Restricted Actions</div>
              <div style={{ fontSize: 10, color: G.muted, lineHeight: 1.8 }}>
                <p>✓ You CAN manage staff and operations</p>
                <p>✓ You CAN assign roles and departments</p>
                <p>✓ You CAN handle maintenance requests</p>
                <p>✗ You CANNOT delete the organization</p>
                <p>✗ You CANNOT transfer ownership</p>
                <p>✗ You CANNOT change billing settings</p>
                <p>✗ You CANNOT access owner-only settings</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
