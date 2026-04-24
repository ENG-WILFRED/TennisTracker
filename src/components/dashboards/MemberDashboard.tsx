'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { LoadingState } from '@/components/LoadingState';
import { processMPesaPayment, processPayPalPayment, processStripePayment } from '@/actions/payments';
import { usePDFDownload } from '@/hooks/usePDFDownload';
import { generateMembershipCardHTML } from '@/utils/generateMembershipCardPDF';
import toast from 'react-hot-toast';

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = {
  bg:       '#0f1f0f',
  surface:  '#1a3020',
  surfaceAlt:'#203520',
  raised:   '#2d5a27',
  deep:     '#1a3020',
  border:   '#2d5a35',
  accent:   '#7aaa6a',
  green:    '#3d7a32',
  light:    '#7dc142',
  tint:     '#e8f5e0',
  text:     '#e8f5e0',
  gold:     '#f0c040',
  danger:   '#d94f4f',
  warn:     '#efc040',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type NavSection = 'overview' | 'memberships' | 'entrycards' | 'family' | 'billing' | 'notifications' | 'organizations' | 'support';

interface Membership {
  id: string;
  orgId: string;
  orgName: string;
  role: string;
  status: 'accepted' | 'pending' | 'suspended';
  joinedAt?: string | null;
  approvedAt?: string | null;
  clubMember?: { membershipTier?: { name: string } };
}

interface EntryCard {
  id: string;
  cardRef: string;
  memberName: string;
  club: string;
  type: string;
  validUntil: string;
  rebillEnabled: boolean;
  rebillStatus: string;
  status: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number | null;
  club: string | null;
  entryCardRef: string | null;
  entryCardStatus: string;
  membershipStatus: string;
  role: string | null;
  monthlyFee: number | null;
  nextDue: string | null;
}

interface Invoice {
  id: string;
  club: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'failed' | 'pending';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  paymentMethods?: string[];
  contactEmail?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  courts?: Array<{
    id: string;
    name: string;
    type: string;
    status: 'available' | 'maintenance' | 'booked';
    pricePerHour?: number;
  }>;
  tournaments?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    entryFee?: number;
    maxParticipants?: number;
  }>;
  events?: Array<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: string;
    status: 'upcoming' | 'ongoing' | 'completed';
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    severity: 'info' | 'warning' | 'danger';
  }>;
}

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'fee' | 'membership';
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  organization?: string;
}

interface DashboardData {
  memberships: Membership[];
  entryCards: EntryCard[];
  familyMembers: FamilyMember[];
  transactions: Transaction[];
  notifications: Notification[];
  organizations: Record<string, Organization>;
  billing: any;
}

// ─── Role entitlements ────────────────────────────────────────────────────────
const ROLE_ENTITLEMENTS: Record<string, string[]> = {
  player:        ['Court access', 'Priority booking', 'Event entry', 'Player support'],
  coach:         ['Player roster access', 'Training schedule tools', 'Club communication', 'Coach resources'],
  referee:       ['Match assignments', 'Score submission', 'Referee notifications', 'Official reports'],
  admin:         ['Organization control', 'Member approvals', 'Reports & analytics', 'Billing management'],
  finance_officer:['Invoice review', 'Payment history', 'Financial summaries', 'Revenue insights'],
  org:           ['Organization overview', 'Membership planning', 'Team permissions', 'Billing dashboards'],
  member:        ['Membership status', 'Organization access', 'Billing summary', 'Support channels'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function cap(s?: string | null) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
const Badge: React.FC<{ children: React.ReactNode; variant: 'green' | 'gold' | 'red' | 'gray' }> = ({ children, variant }) => {
  const colors = {
    green: { border: G.green,  color: G.green  },
    gold:  { border: G.gold,   color: G.gold   },
    red:   { border: G.danger, color: G.danger },
    gray:  { border: G.border, color: G.tint   },
  }[variant];
  return (
    <span style={{ borderRadius: 100, border: `1px solid ${colors.border}`, color: colors.color,
      padding: '4px 10px', fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>
      {children}
    </span>
  );
};

const Pill: React.FC<{ children: React.ReactNode; variant: 'green' | 'gold' | 'red' | 'gray' }> = ({ children, variant }) => {
  const styles = {
    green: { background: 'rgba(98,168,120,0.15)', color: G.green  },
    gold:  { background: 'rgba(212,184,74,0.15)', color: G.gold   },
    red:   { background: 'rgba(201,112,112,0.15)',color: G.danger },
    gray:  { background: G.raised, color: G.tint },
  }[variant];
  return (
    <span style={{ borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 500, ...styles }}>
      {children}
    </span>
  );
};

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost'; size?: 'md' | 'sm' | 'xs' }> = ({
  variant = 'ghost', size = 'md', style, children, ...rest
}) => {
  const base: React.CSSProperties = {
    border: 'none', cursor: 'pointer', fontWeight: 500, borderRadius: 100, transition: 'opacity 0.12s',
    padding: size === 'xs' ? '5px 10px' : size === 'sm' ? '6px 14px' : '9px 18px',
    fontSize: size === 'xs' ? 11 : size === 'sm' ? 12 : 13,
  };
  const variantStyle: React.CSSProperties = variant === 'primary'
    ? { background: G.green, color: G.bg }
    : { background: G.raised, color: G.tint, border: `1px solid ${G.border}` };
  return <button style={{ ...base, ...variantStyle, ...style }} {...rest}>{children}</button>;
};

const StatCard: React.FC<{ label: string; value: number | string; desc: string; accent?: string }> = ({ label, value, desc, accent = G.green }) => (
  <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16,
    position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
    <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 500, color: G.text, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: G.accent, marginTop: 5, lineHeight: 1.4 }}>{desc}</div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 18, padding: 20, marginBottom: 16, ...style }}>
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; sub?: string; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, color: G.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: G.accent, marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

const DL: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: G.accent, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 12, color: G.text }}>{value}</div>
  </div>
);

// ─── Nav items config ─────────────────────────────────────────────────────────
const NAV_MAIN: { id: NavSection; label: string; badgeProp?: string }[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'memberships',    label: 'Memberships',       badgeProp: 'membershipCount' },
  { id: 'entrycards',     label: 'Entry cards & rebill', badgeProp: 'rebillAlerts' },
  { id: 'family',         label: 'Family members',    badgeProp: 'familyCount' },
  { id: 'organizations',  label: 'Organization details', badgeProp: 'organizationCount' },
];
const NAV_FINANCE: { id: NavSection; label: string; badgeProp?: string }[] = [
  { id: 'billing',        label: 'Recent transactions' },
  { id: 'notifications',  label: 'Notifications',     badgeProp: 'notifCount' },
];
const NAV_ACCOUNT: { id: NavSection; label: string }[] = [
  { id: 'support', label: 'Support' },
];

// ─── Main component ───────────────────────────────────────────────────────────
const MemberDashboardComponent: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentRole } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body, html { margin: 0; padding: 0; }
      .dashboard-container { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; background: ${G.bg}; }
      .sidebar { width: 220px; position: relative; border-right: 1px solid ${G.border}; padding: 24px 0; display: flex; flex-direction: column; }
      .main-content { padding: 28px 24px; overflow-y: auto; }
      .mobile-menu-btn { display: none !important; }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media (max-width: 768px) {
        .dashboard-container { grid-template-columns: 1fr; }
        .mobile-menu-btn { display: flex !important; position: fixed; top: 20px; left: 20px; z-index: 1001; background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 8px; padding: 8px; cursor: pointer; color: ${G.text}; align-items: center; justify-content: center; }
        .main-content { padding: 90px 16px 24px !important; }
        .sidebar { position: fixed; left: -280px; top: 0; height: 100vh; z-index: 1000; width: min(280px, 85vw); transition: left 0.3s ease; }
        .sidebar.open { left: 0 !important; }
        .sidebar-overlay.open { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }
        .stat-grid { grid-template-columns: 1fr !important; }
        .two-col { grid-template-columns: 1fr !important; }
        .card-grid { grid-template-columns: 1fr !important; }
        .table-responsive { overflow-x: auto; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      await logout();
      router.push('/login');
    }
  }, [logout, router]);

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  // Initialize section from URL parameter, fallback to 'overview'
  const [section, setSection]   = useState<NavSection>(() => {
    const tabParam = searchParams.get('tab');
    const validSections: NavSection[] = ['overview', 'memberships', 'entrycards', 'family', 'billing', 'notifications', 'organizations', 'support'];
    return (tabParam && validSections.includes(tabParam as NavSection)) ? (tabParam as NavSection) : 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData]         = useState<DashboardData>({
    memberships: [], entryCards: [], familyMembers: [],
    transactions: [], notifications: [], organizations: {}, billing: null,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Record<string, string>>({});
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', email: '', relation: '' });
  const [generatingPDFFor, setGeneratingPDFFor] = useState<string | null>(null);

  const handleTabChange = useCallback((tabId: NavSection) => {
    setSection(tabId);
    // Update URL with the selected tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authenticatedFetch('/api/user/memberships');
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body?.error || 'Unable to load dashboard.');
        }
        const json = await res.json();
        const memberships: Membership[] = json.memberships || [];
        
        // Fetch organization details for each membership
        const organizations: Record<string, Organization> = {};
        await Promise.all(
          memberships.map(async (m) => {
            try {
              const orgRes = await authenticatedFetch(`/api/organization/${m.orgId}`);
              if (orgRes.ok) {
                const orgData = await orgRes.json();
                // Fetch additional organization details
                const [courtsRes, tournamentsRes, eventsRes, orgNotificationsRes] = await Promise.all([
                  authenticatedFetch(`/api/organization/${m.orgId}/courts`),
                  authenticatedFetch(`/api/organization/${m.orgId}/tournaments`),
                  authenticatedFetch(`/api/organization/${m.orgId}/events`),
                  authenticatedFetch(`/api/organization/${m.orgId}/notifications`)
                ]);

                const courts = courtsRes.ok ? await courtsRes.json() : [];
                const tournaments = tournamentsRes.ok ? await tournamentsRes.json() : [];
                const events = eventsRes.ok ? await eventsRes.json() : [];
                const orgNotifications = orgNotificationsRes.ok ? await orgNotificationsRes.json() : [];

                organizations[m.orgId] = {
                  ...orgData,
                  courts,
                  tournaments,
                  events,
                  notifications: orgNotifications
                };
              }
            } catch (e) {
              console.error(`Failed to fetch org ${m.orgId}:`, e);
            }
          })
        );

        const entryCards = memberships.map((m: any, index: number) => ({
          id: `card-${index}`,
          cardRef: `MEM${m.id.slice(-6)}`,
          memberName: user?.firstName || user?.email || 'Member',
          club: m.orgName,
          type: m.clubMember?.tier || 'Standard',
          validUntil: m.clubMember ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : 'N/A',
          rebillEnabled: true,
          rebillStatus: m.clubMember?.paymentStatus === 'active' ? 'active' : 'failed',
          status: m.status === 'accepted' ? 'active' : 'suspended',
        }));

        const familyMembers = memberships.filter((m: any) => m.clubMember).map((m: any, index: number) => ({
          id: `family-${index}`,
          name: user?.firstName || user?.email || 'Member',
          relation: 'Self',
          age: null,
          club: m.orgName,
          entryCardRef: `MEM${m.id.slice(-6)}`,
          entryCardStatus: m.clubMember?.paymentStatus === 'active' ? 'active' : 'failed',
          membershipStatus: m.status,
          role: m.role,
          monthlyFee: m.clubMember?.monthlyPrice || 0,
          nextDue: m.clubMember ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        }));

        const transactions = memberships.filter((m: any) => m.clubMember).map((m: any, index: number) => ({
          id: `txn-${index}`,
          type: 'membership' as const,
          amount: m.clubMember?.monthlyPrice || 0,
          currency: 'KES',
          description: `Monthly membership - ${m.clubMember?.tier || 'Standard'}`,
          date: new Date().toISOString().split('T')[0],
          status: m.clubMember?.paymentStatus === 'active' ? 'completed' as const : 'pending' as const,
          paymentMethod: selectedPaymentMethod[m.orgId] || 'credit_card',
          organization: m.orgName,
        }));

        setData({
          memberships,
          entryCards,
          familyMembers,
          transactions,
          organizations,
          notifications: json.notifications || [],
          billing: json.billing || null,
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // Derived - Calculate before any early returns (Rules of Hooks)
  const activeMem = useMemo(() => data.memberships.filter((m: { status: string; }) => m.status === 'accepted'), [data.memberships]);
  const pendingMem = useMemo(() => data.memberships.filter((m: { status: string; }) => m.status === 'pending'), [data.memberships]);
  const membershipRoles = useMemo(() => Array.from(new Set(data.memberships.map((m) => m.role))).filter(Boolean) as string[], [data.memberships]);
  const rebillAlerts = useMemo(() => data.entryCards.filter((c: { rebillStatus: string; }) => c.rebillStatus === 'failed' || c.rebillStatus === 'expiring'), [data.entryCards]);
  const unreadNotifs = useMemo(() => data.notifications.filter((n: { severity: string; }) => n.severity !== 'info'), [data.notifications]);

  // Nav badge helper - Must be before early returns
  const getBadge = useCallback((prop?: string): { count: number; color?: string } | null => {
    if (!prop) return null;
    const map: Record<string, { count: number; color?: string }> = {
      membershipCount: { count: data.memberships.length },
      rebillAlerts:    { count: rebillAlerts.length, color: G.gold },
      familyCount:     { count: data.familyMembers.length },
      notifCount:      { count: unreadNotifs.length, color: G.danger },
    };
    const b = map[prop];
    return b && b.count > 0 ? b : null;
  }, [data.memberships.length, rebillAlerts.length, data.familyMembers.length, unreadNotifs.length, G.gold, G.danger]);

  const primaryOrganization = useMemo(() => Object.values(data.organizations)[0] || null, [data.organizations]);

  // Payment method handler
  const handlePaymentMethodChange = useCallback(async (orgId: string, method: string) => {
    setSelectedPaymentMethod(prev => ({ ...prev, [orgId]: method }));

    // For demonstration, we'll show a toast. In a real implementation,
    // you'd collect payment details and call the appropriate payment function
    if (method === 'mpesa') {
      toast.success('M-Pesa payment method selected. Integration ready for mobile number input.');
    } else if (method === 'stripe') {
      toast.success('Stripe payment method selected. Integration ready for card details.');
    } else if (method === 'paypal') {
      toast.success('PayPal payment method selected. Integration ready for PayPal login.');
    } else {
      toast.success(`Payment method set to ${method}`);
    }
  }, []);

  // Family member linking handler
  const handleLinkFamilyMember = useCallback(async () => {
    if (!newFamilyMember.name || !newFamilyMember.email) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const res = await authenticatedFetch('/api/user/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFamilyMember),
      });
      if (res.ok) {
        toast.success('Family member linked successfully');
        setNewFamilyMember({ name: '', email: '', relation: '' });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to link family member');
      }
    } catch (e) {
      toast.error('Error linking family member');
    }
  }, [newFamilyMember]);

  // Membership termination handler
  const handleMembershipTermination = useCallback(async (membership: Membership) => {
    const org = data.organizations[membership.orgId];
    const confirmMessage = `Are you sure you want to request termination of your membership with ${membership.orgName}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await authenticatedFetch('/api/user/membership-termination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: membership.id,
          orgId: membership.orgId,
          reason: 'Member requested termination',
        }),
      });

      if (res.ok) {
        toast.success(`Termination request sent to ${membership.orgName}`);
        // Optionally refresh data
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to request termination');
      }
    } catch (e) {
      toast.error('Error requesting membership termination');
    }
  }, [data.organizations]);

  const { downloadPDF } = usePDFDownload();

  // PDF generation function
  const generateAccessPDF = useCallback(async (membership: Membership) => {
    try {
      setGeneratingPDFFor(membership.id);
      const org = data.organizations[membership.orgId] as any;
      const sanitizedOrgName = (membership.orgName || org?.name || 'Membership').replace(/[^a-z0-9]/gi, '_');
      const filename = `VicoTennis_${sanitizedOrgName}_access_${String(user?.id || 'member')}.pdf`;

      // Generate the membership card HTML using the utility
      const cardHTML = await generateMembershipCardHTML({
        memberName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Member',
        memberId: String(user?.id || 'N/A'),
        organizationName: org?.name || membership.orgName || '—',
        organizationEmail: org?.email || undefined,
        organizationPhone: org?.phone || undefined,
        role: cap(membership.role) || 'Member',
        status: cap(membership.status) || '—',
        accessLevel: membership.clubMember?.membershipTier?.name || 'Standard',
        joinedDate: formatDate(membership.joinedAt),
        approvedDate: formatDate(membership.approvedAt),
        expiryDate: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()), // 1 year from now
        qrCodeData: `${typeof window !== 'undefined' && window.location.hostname === 'localhost' ? process.env.NEXT_PUBLIC_TEST_BASE_URL : process.env.NEXT_PUBLIC_SITE_URL}/api/verify/${user?.id}?org=${membership.orgId}`,
      });

      // Download the single-page PDF
      await downloadPDF(cardHTML, {
        filename,
        orientation: 'portrait',
        format: 'a4',
        margin: 0, // No extra margin needed for full-page design
      });

      toast.success('Vico Tennis member access card generated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate access document');
    } finally {
      setGeneratingPDFFor(null);
    }
  }, [data.organizations, downloadPDF, user]);

  // Receipt generation function
  const generateReceipt = useCallback((transaction: Transaction) => {
    try {
      const org = (Object.values(data.organizations) as Organization[]).find(o => o.name === transaction.organization);

      const receiptContent = `
        VICO TENNIS - PAYMENT RECEIPT
        ================================
        Transaction ID: ${transaction.id}
        Organization: ${transaction.organization}
        Member Name: ${user?.firstName} ${user?.lastName || ''}
        Member ID: ${user?.id}

        Transaction Details:
        Type: ${cap(transaction.type)}
        Description: ${transaction.description}
        Amount: ${transaction.currency} ${transaction.amount.toLocaleString()}
        Payment Method: ${transaction.paymentMethod ? (
          transaction.paymentMethod === 'mpesa' ? 'M-Pesa' :
          transaction.paymentMethod === 'stripe' ? 'Stripe' :
          transaction.paymentMethod === 'paypal' ? 'PayPal' :
          cap(transaction.paymentMethod.replace('_', ' '))
        ) : 'Not specified'}
        Date: ${formatDate(transaction.date)}
        Status: ${cap(transaction.status)}

        Organization Contact:
        Email: ${org?.contactEmail || 'N/A'}
        Phone: ${org?.phoneNumber || 'N/A'}

        Thank you for your transaction!
        Generated: ${new Date().toLocaleString()}

        ---
        VICO TENNIS - WATERMARK
        ---
      `;

      const element = document.createElement('a');
      const file = new Blob([receiptContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `VicoTennis_Receipt_${transaction.id}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Vico Tennis receipt generated');
    } catch (e) {
      toast.error('Failed to generate receipt');
    }
  }, [data.organizations, user]);
  if (loading) return <LoadingState icon="💳" message="Loading member dashboard…" />;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const NavItem: React.FC<{ id: NavSection; label: string; badge?: { count: number; color?: string } | null }> = ({ id, label, badge }) => (
    <button
      onClick={() => handleTabChange(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', margin: '2px 8px', borderRadius: 10,
        fontSize: 13, color: section === id ? G.light : G.tint,
        cursor: 'pointer', border: section === id ? `1px solid ${G.border}` : '1px solid transparent',
        background: section === id ? G.raised : 'transparent', width: 'calc(100% - 16px)', textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      {label}
      {badge && (
        <span style={{ marginLeft: 'auto', background: badge.color || G.green, color: G.bg,
          borderRadius: 100, fontSize: 10, fontWeight: 500, padding: '2px 7px' }}>
          {badge.count}
        </span>
      )}
    </button>
  );

  const SidebarSection: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ padding: '16px 20px 4px', fontSize: 10, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: G.accent }}>
      {label}
    </div>
  );

  // ── Entry card rebill status helpers ──────────────────────────────────────
  const cardStatusBadge = (card: EntryCard) => {
    if (card.status === 'suspended') return <Pill variant="red">Suspended</Pill>;
    if (card.rebillStatus === 'expiring') return <Pill variant="gold">Expiring</Pill>;
    if (card.status === 'active') return <Pill variant="green">Active</Pill>;
    return <Pill variant="gray">Inactive</Pill>;
  };
  const rebillBadge = (card: EntryCard) => {
    if (card.rebillStatus === 'failed')   return <Pill variant="red">Failed</Pill>;
    if (!card.rebillEnabled)              return <Pill variant="gray">Off</Pill>;
    return <Pill variant="green">On</Pill>;
  };
  const cardAction = (card: EntryCard) => {
    if (card.rebillStatus === 'failed')   return <Btn variant="primary" size="xs" style={{ background: G.danger, color: '#fff' }}>Fix rebill</Btn>;
    if (card.rebillStatus === 'expiring') return <Btn variant="primary" size="xs" style={{ background: G.gold, color: G.bg }}>Renew</Btn>;
    return <Btn size="xs">Manage</Btn>;
  };

  // ── Sections ──────────────────────────────────────────────────────────────
  const twoCol = (main: React.ReactNode, aside: React.ReactNode) => (
    <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
      <div>{main}</div>
      <div>{aside}</div>
    </div>
  );

  const SectionOverview = () => (
    <>
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        <StatCard label="Active" value={activeMem.length} desc="Approved memberships" />
        <StatCard label="Pending" value={pendingMem.length} desc="Awaiting review" accent={G.gold} />
        <StatCard label="Family" value={data.familyMembers.length} desc="Linked members" accent={G.light} />
        <StatCard label="Entry cards" value={data.entryCards.length} desc="Active passes" />
      </div>
      {twoCol(
        <Card>
          <CardHeader title="Quick status" sub="Your most recent membership activity." />
          {data.memberships.slice(0, 3).map((m) => (
            <div key={m.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
              borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: G.text }}>{m.orgName}</div>
                  <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>
                    {cap(m.role)}{m.clubMember?.membershipTier?.name ? ` · ${m.clubMember.membershipTier.name}` : ''}
                  </div>
                </div>
                <Badge variant={m.status === 'accepted' ? 'green' : m.status === 'pending' ? 'gold' : 'red'}>
                  {m.status}
                </Badge>
              </div>
              <Btn variant="primary" size="xs" onClick={() => router.push(`/organization/${m.orgId}`)}>View org</Btn>
            </div>
          ))}
        </Card>,
        <>
          <Card>
            <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 12 }}>Upcoming payments</div>
            <div style={{ background: G.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, marginBottom: 4 }}>Next due</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{data.billing?.nextPayment ?? '—'}</div>
            </div>
            <div style={{ background: G.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, marginBottom: 4 }}>Monthly estimate</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{data.billing?.monthlyEstimate ?? 'See org details'}</div>
            </div>
            <Btn style={{ width: '100%', marginTop: 4 }} onClick={() => handleTabChange('billing')}>View all invoices</Btn>
          </Card>
          {rebillAlerts.length > 0 && (
            <Card>
              <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 10 }}>Rebill alerts</div>
              {rebillAlerts.map((c: { id: React.Key | null | undefined; rebillStatus: string; cardRef: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; memberName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; club: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; validUntil: string | null | undefined; }) => (
                <div key={c.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.gold}`,
                  borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G.gold, marginBottom: 3 }}>
                    {c.rebillStatus === 'failed' ? 'Rebill failed' : 'Card expiring'} — {c.cardRef}
                  </div>
                  <div style={{ fontSize: 11, color: G.accent, lineHeight: 1.5 }}>
                    {c.memberName} · {c.club} · Expires {formatDate(c.validUntil)}
                  </div>
                </div>
              ))}
              <Btn variant="primary" size="sm" style={{ width: '100%', marginTop: 4 }}
                onClick={() => handleTabChange('entrycards')}>
                Manage entry cards
              </Btn>
            </Card>
          )}
        </>,
      )}
    </>
  );

  const SectionMemberships = () => (
    twoCol(
      <>
        <Card>
          <CardHeader
            title="Membership status"
            sub="Your roles and approval states across organizations."
            action={membershipRoles.length > 0 ? (
              <div style={{ background: G.raised, border: `1px solid ${G.border}`, borderRadius: 100,
                padding: '6px 14px', fontSize: 12, fontWeight: 500, color: G.light }}>
                {membershipRoles.map(cap).join(', ')}
              </div>
            ) : undefined}
          />
          {data.memberships.length === 0 ? (
            <div style={{ background: G.surfaceAlt, border: `1px dashed ${G.border}`, borderRadius: 14,
              padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: G.accent, marginBottom: 14 }}>No memberships yet.</p>
              <Btn variant="primary" onClick={() => router.push(`/dashboard/spectator/${user!.id}`)}>Find organizations</Btn>
            </div>
          ) : data.memberships.map((m: Membership) => {
            const org = data.organizations[m.orgId];
            return (
              <div key={m.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
                borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: G.text }}>{m.orgName}</div>
                    <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>Role: {cap(m.role)}</div>
                    {org?.description && (
                      <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>{org.description}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge variant={m.status === 'accepted' ? 'green' : m.status === 'pending' ? 'gold' : 'red'}>
                      {m.status}
                    </Badge>
                    {m.clubMember?.membershipTier?.name && (
                      <Badge variant="gold">{m.clubMember.membershipTier.name} tier</Badge>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                  padding: 10, background: G.surface, borderRadius: 8, marginBottom: 12 }}>
                  <DL label="Joined"   value={formatDate(m.joinedAt)} />
                  <DL label="Approved" value={formatDate(m.approvedAt)} />
                </div>
                {org && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                    padding: 10, background: G.surface, borderRadius: 8, marginBottom: 12 }}>
                    <DL label="Contact" value={org.contactEmail || 'N/A'} />
                    <DL label="Phone" value={org.phoneNumber || 'N/A'} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Btn variant="primary" size="sm" onClick={() => router.push(`/organization/${m.orgId}`)}>Open org</Btn>
                  <Btn 
                    size="sm" 
                    onClick={() => generateAccessPDF(m)}
                    disabled={generatingPDFFor === m.id}
                    style={{ opacity: generatingPDFFor === m.id ? 0.7 : 1, cursor: generatingPDFFor === m.id ? 'not-allowed' : 'pointer' }}
                  >
                    {generatingPDFFor === m.id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid currentColor', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                        Generating...
                      </span>
                    ) : (
                      'Generate PDF'
                    )}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => handleMembershipTermination(m)} style={{ color: G.danger }}>Terminate</Btn>
                  <Btn size="sm" onClick={() => router.push('/support')}>Support</Btn>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <CardHeader title="Entitlements & usage" sub="Benefits unlocked across your active roles." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {membershipRoles.length > 0 ? membershipRoles.map(role => (
              <div key={role} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
                borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: G.text, marginBottom: 8 }}>{cap(role)} access</div>
                {(ROLE_ENTITLEMENTS[role] || ROLE_ENTITLEMENTS.member).map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, color: G.accent, padding: '2px 0' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: G.green, flexShrink: 0, display: 'inline-block' }} />
                    {item}
                  </div>
                ))}
              </div>
            )) : (
              <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: G.accent }}>No active entitlements yet.</div>
              </div>
            )}
          </div>
        </Card>
      </>,
      <>
        <Card>
          <CardHeader title="Payment methods" sub="Choose how to pay for each organization." />
          {data.memberships.filter((m) => m.status === 'accepted').map((m) => {
            const org = data.organizations[m.orgId];
            const paymentMethods = org?.paymentMethods || ['credit_card', 'bank_transfer'];
            return (
              <div key={m.orgId} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
                borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 12 }}>{m.orgName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {paymentMethods.map((method) => (
                    <Btn
                      key={method}
                      size="sm"
                      variant={selectedPaymentMethod[m.orgId] === method ? 'primary' : 'ghost'}
                      onClick={() => handlePaymentMethodChange(m.orgId, method)}
                      style={{ justifyContent: 'center' }}
                    >
                      {method === 'mpesa' ? 'M-Pesa' :
                       method === 'stripe' ? 'Stripe' :
                       method === 'paypal' ? 'PayPal' :
                       cap(method.replace('_', ' '))}
                    </Btn>
                  ))}
                </div>
                {selectedPaymentMethod[m.orgId] && (
                  <div style={{ marginTop: 8, fontSize: 11, color: G.accent }}>
                    Selected: {selectedPaymentMethod[m.orgId] === 'mpesa' ? 'M-Pesa' :
                              selectedPaymentMethod[m.orgId] === 'stripe' ? 'Stripe' :
                              selectedPaymentMethod[m.orgId] === 'paypal' ? 'PayPal' :
                              cap(selectedPaymentMethod[m.orgId].replace('_', ' '))}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 12 }}>Billing summary</div>
          {([
            { label: 'Next payment',       value: data.billing?.nextPayment      ?? '—' },
            { label: 'Monthly estimate',   value: data.billing?.monthlyEstimate  ?? 'See org details' },
            { label: 'Note',               value: data.billing?.note             ?? 'Admin manages billing.' },
          ] as { label: string; value: string }[]).map(row => (
            <div key={row.label} style={{ background: G.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, marginBottom: 4 }}>{row.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{row.value}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 12 }}>Recent notifications</div>
          {data.notifications.length > 0 ? data.notifications.slice(0, 3).map((n: { id: React.Key | null | undefined; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; message: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
            <div key={n.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
              borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: G.text, marginBottom: 3 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: G.accent, lineHeight: 1.5 }}>{n.message}</div>
            </div>
          )) : (
            <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: G.accent }}>No recent alerts.</div>
            </div>
          )}
        </Card>
      </>,
    )
  );

  const SectionEntryCards = () => (
    <>
      {rebillAlerts.length > 0 && (
        <div style={{ background: G.raised, border: `1px solid ${G.gold}`, borderRadius: 12,
          padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: G.text, marginBottom: 2 }}>
              {rebillAlerts.length} card{rebillAlerts.length > 1 ? 's' : ''} require action
            </div>
            <div style={{ fontSize: 11, color: G.accent, lineHeight: 1.4 }}>
              {rebillAlerts.map((c: { cardRef: any; rebillStatus: any; }) => `${c.cardRef} — ${c.rebillStatus}`).join(' · ')}
            </div>
          </div>
          <Btn variant="primary" size="sm" style={{ background: G.gold, color: G.bg, flexShrink: 0 }}>Resolve</Btn>
        </div>
      )}

      <Card>
        <CardHeader
          title="Active entry cards"
          sub="All passes linked to your account and family members."
          action={<Btn variant="primary" size="sm">+ New card</Btn>}
        />
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Card ID', 'Member', 'Club', 'Type', 'Valid until', 'Rebill', 'Status', ''].map(h => (
                  <th key={h} style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: G.accent, padding: '0 10px 10px', textAlign: 'left', fontWeight: 400,
                    borderBottom: `1px solid ${G.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.entryCards.map((card: EntryCard) => (
                <tr key={card.id}>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: G.light,
                    fontFamily: 'monospace', borderBottom: `1px solid ${G.raised}` }}>{card.cardRef}</td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: G.text,
                    borderBottom: `1px solid ${G.raised}` }}>{card.memberName}</td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: G.text,
                    borderBottom: `1px solid ${G.raised}` }}>{card.club}</td>
                  <td style={{ padding: '12px 10px', fontSize: 12, color: G.text,
                    borderBottom: `1px solid ${G.raised}` }}>{cap(card.type)}</td>
                  <td style={{ padding: '12px 10px', fontSize: 12,
                    color: card.rebillStatus === 'expiring' ? G.gold : G.text,
                    borderBottom: `1px solid ${G.raised}` }}>{formatDate(card.validUntil)}</td>
                  <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                    {rebillBadge(card)}
                  </td>
                  <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                    {cardStatusBadge(card)}
                  </td>
                  <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                    {cardAction(card)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Rebill settings" sub="Control auto-renewal for each entry card." />
        <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Default payment method</div>
              <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>
                {data.billing?.defaultCard ?? 'No card on file'}
              </div>
            </div>
            <Btn size="sm">Update card</Btn>
          </div>
        </div>
        <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Rebill notifications</div>
              <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>Email 7 days before renewal · SMS on failure</div>
            </div>
            <Btn size="sm">Edit prefs</Btn>
          </div>
        </div>
      </Card>
    </>
  );

  const SectionFamily = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        <StatCard label="Linked members" value={data.familyMembers.length} desc="On your family plan" />
        <StatCard label="Active cards" value={data.entryCards.filter((c: { status: string; }) => c.status === 'active').length} desc="Passes across family" accent={G.light} />
        <StatCard label="Pending actions" value={rebillAlerts.length} desc="Rebill issues" accent={G.gold} />
      </div>

      <Card>
        <CardHeader
          title="Family members"
          sub="Linked accounts sharing your plan and clubs."
          action={<Btn variant="primary" size="sm">+ Add member</Btn>}
        />
        {/* Add Family Member Form */}
        <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 12 }}>Link new family member</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 11, color: G.accent, marginBottom: 4 }}>Full Name</div>
              <input
                type="text"
                value={newFamilyMember.name}
                onChange={(e) => setNewFamilyMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${G.border}`,
                  background: G.surface, color: G.text, fontSize: 12
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.accent, marginBottom: 4 }}>Email</div>
              <input
                type="email"
                value={newFamilyMember.email}
                onChange={(e) => setNewFamilyMember(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${G.border}`,
                  background: G.surface, color: G.text, fontSize: 12
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: G.accent, marginBottom: 4 }}>Relation</div>
              <select
                value={newFamilyMember.relation}
                onChange={(e) => setNewFamilyMember(prev => ({ ...prev, relation: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${G.border}`,
                  background: G.surface, color: G.text, fontSize: 12
                }}
              >
                <option value="">Select relation</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Btn variant="primary" size="sm" onClick={handleLinkFamilyMember}>Link Member</Btn>
          </div>
        </div>
        <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {data.familyMembers.map((fm) => (
            <div key={fm.id} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
              borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: G.deep,
                  border: `1px solid ${G.border}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 500, color: G.light, flexShrink: 0 }}>
                  {fm.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{fm.name}</div>
                  <div style={{ fontSize: 11, color: G.accent, marginTop: 1 }}>
                    {fm.relation}{fm.age ? ` · Age ${fm.age}` : ''}
                  </div>
                </div>
              </div>
              {[
                { label: 'Status', value: <Pill variant={fm.membershipStatus === 'active' ? 'green' : fm.membershipStatus === 'pending' ? 'gold' : 'red'}>{cap(fm.membershipStatus)}</Pill> },
                { label: 'Club',   value: <span style={{ fontSize: 11, color: G.text }}>{fm.club ?? '—'}</span> },
                { label: 'Card',   value: <span style={{ fontSize: 11, color: fm.entryCardStatus === 'failed' ? G.danger : G.text }}>{fm.entryCardRef ?? 'None'}</span> },
                { label: 'Role',   value: <span style={{ fontSize: 11, color: G.text }}>{cap(fm.role) || '—'}</span> },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '3px 0', fontSize: 11, color: G.accent }}>
                  <span>{row.label}</span>
                  {row.value}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {fm.entryCardStatus === 'failed'
                  ? <Btn size="xs" style={{ background: G.danger, color: '#fff' }}>Fix rebill</Btn>
                  : fm.entryCardRef
                    ? <Btn variant="primary" size="xs">Manage</Btn>
                    : <Btn size="xs">Issue card</Btn>
                }
                <Btn size="xs">Edit</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Family billing overview" />
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Member', 'Club', 'Plan', 'Monthly', 'Next due', 'Status'].map(h => (
                  <th key={h} style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: G.accent, padding: '0 10px 10px', textAlign: 'left', fontWeight: 400,
                    borderBottom: `1px solid ${G.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.familyMembers.map((fm) => (
                <tr key={fm.id}>
                  <td style={{ padding: '10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>{fm.name}</td>
                  <td style={{ padding: '10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>{fm.club ?? '—'}</td>
                  <td style={{ padding: '10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>{cap(fm.role) || '—'}</td>
                  <td style={{ padding: '10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>
                    {fm.monthlyFee ? `KES ${fm.monthlyFee.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>
                    {fm.nextDue ?? '—'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${G.raised}` }}>
                    <Pill variant={fm.membershipStatus === 'active' ? 'green' : fm.membershipStatus === 'pending' ? 'gold' : 'red'}>
                      {cap(fm.membershipStatus)}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.familyMembers.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
            <span style={{ fontSize: 12, color: G.accent }}>Family total / month</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: G.text }}>
              KES {data.familyMembers.reduce((s, m) => s + (m.monthlyFee || 0), 0).toLocaleString()}
            </span>
          </div>
        )}
      </Card>
    </>
  );

  const SectionOrganizations = () => {
    const membershipsWithOrgs = data.memberships.map((m) => ({
      membership: m,
      organization: data.organizations[m.orgId],
    }));

    if (membershipsWithOrgs.length === 0) {
      return (
        <Card>
          <CardHeader title="Organization Details" />
          <div style={{ fontSize: 13, color: G.accent }}>You are not currently a member of any organization.</div>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader title="Organization Details" />
        <div style={{ display: 'grid', gap: 20 }}>
          {membershipsWithOrgs.map(({ membership, organization }) => (
            <div key={membership.orgId} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{organization?.name || membership.orgName}</div>
                  <div style={{ fontSize: 11, color: G.accent, marginTop: 3 }}>{cap(membership.role)} member</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Pill variant={membership.status === 'accepted' ? 'green' : membership.status === 'pending' ? 'gold' : 'red'}>
                    {cap(membership.status)}
                  </Pill>
                  <Btn size="xs" onClick={() => router.push(`/organization/${membership.orgId}`)}>Open org</Btn>
                </div>
              </div>

              {!organization ? (
                <div style={{ fontSize: 12, color: G.accent }}>Loading organization data for this membership…</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
                    <DL label="Organization" value={organization.name} />
                    <DL label="Email" value={organization.contactEmail || 'N/A'} />
                    <DL label="Phone" value={organization.phone || organization.phoneNumber || 'N/A'} />
                    <DL label="Address" value={organization.address || 'N/A'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: G.surface, border: `1px solid ${G.raised}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, color: G.accent, marginBottom: 8 }}>Courts</div>
                      {organization.courts && organization.courts.length > 0 ? (
                        organization.courts.map((court) => (
                          <div key={court.id} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{court.name}</div>
                            <div style={{ fontSize: 11, color: G.accent }}>{court.type} • {court.pricePerHour ? `KES ${court.pricePerHour}/hr` : 'No rate'}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 12, color: G.accent }}>No courts listed.</div>
                      )}
                    </div>

                    <div style={{ background: G.surface, border: `1px solid ${G.raised}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, color: G.accent, marginBottom: 8 }}>Tournaments</div>
                      {organization.tournaments && organization.tournaments.length > 0 ? (
                        organization.tournaments.map((tournament: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; startDate: string | null | undefined; endDate: string | null | undefined; }) => (
                          <div key={tournament.id} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{tournament.name}</div>
                            <div style={{ fontSize: 11, color: G.accent }}>{formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 12, color: G.accent }}>No tournaments available.</div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: G.surface, border: `1px solid ${G.raised}`, borderRadius: 12, padding: 14, marginTop: 18 }}>
                    <div style={{ fontSize: 12, color: G.accent, marginBottom: 8 }}>Upcoming events</div>
                    {organization.events && organization.events.length > 0 ? (
                      organization.events.map((event: { id: React.Key | null | undefined; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; startDate: string | null | undefined; endDate: string | null | undefined; }) => (
                        <div key={event.id} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{event.title}</div>
                          <div style={{ fontSize: 11, color: G.accent }}>{formatDate(event.startDate)} – {formatDate(event.endDate)}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: G.accent }}>No events available.</div>
                    )}
                  </div>

                  <div style={{ background: G.surface, border: `1px solid ${G.raised}`, borderRadius: 12, padding: 14, marginTop: 18 }}>
                    <div style={{ fontSize: 12, color: G.accent, marginBottom: 8 }}>Notifications</div>
                    {organization.notifications && organization.notifications.length > 0 ? (
                      organization.notifications.map((notification: { id: React.Key | null | undefined; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; createdAt: string | null | undefined; }) => (
                        <div key={notification.id} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{notification.title}</div>
                          <div style={{ fontSize: 11, color: G.accent }}>{formatDate(notification.createdAt)}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: G.accent }}>No organization notifications.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const SectionBilling = () => (
    <Card>
      <CardHeader title="Recent transactions" action={<Btn size="sm">Download all</Btn>} />
      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Transaction', 'Type', 'Organization', 'Description', 'Amount', 'Date', 'Status', 'Payment Method', ''].map(h => (
                <th key={h} style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: G.accent, padding: '0 10px 10px', textAlign: 'left', fontWeight: 400,
                  borderBottom: `1px solid ${G.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((txn: Transaction) => (
              <tr key={txn.id}>
                <td style={{ padding: '12px 10px', fontSize: 12, color: G.light, fontFamily: 'monospace',
                  borderBottom: `1px solid ${G.raised}` }}>{txn.id}</td>
                <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                  <Pill variant={txn.type === 'payment' ? 'green' : txn.type === 'refund' ? 'gold' : 'gray'}>
                    {cap(txn.type)}
                  </Pill>
                </td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>{txn.organization}</td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>{txn.description}</td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>
                  {txn.currency} {txn.amount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 10px', fontSize: 12, color: G.text, borderBottom: `1px solid ${G.raised}` }}>
                  {formatDate(txn.date)}
                </td>
                <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                  <Pill variant={txn.status === 'completed' ? 'green' : txn.status === 'failed' ? 'red' : 'gold'}>
                    {cap(txn.status)}
                  </Pill>
                </td>
                <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                  <span style={{ fontSize: 11, color: G.accent }}>
                    {txn.paymentMethod ? (
                      txn.paymentMethod === 'mpesa' ? 'M-Pesa' :
                      txn.paymentMethod === 'stripe' ? 'Stripe' :
                      txn.paymentMethod === 'paypal' ? 'PayPal' :
                      cap(txn.paymentMethod.replace('_', ' '))
                    ) : 'Not set'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', borderBottom: `1px solid ${G.raised}` }}>
                  <Btn size="xs" onClick={() => generateReceipt(txn)}>Receipt</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const SectionNotifications = () => (
    <Card>
      {data.notifications.length === 0
        ? <div style={{ fontSize: 13, color: G.accent }}>No recent alerts. Everything is up to date.</div>
        : data.notifications.map((n: { id: React.Key | null | undefined; severity: string; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; message: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
          <div key={n.id} style={{ background: G.surfaceAlt,
            border: `1px solid ${n.severity === 'danger' ? G.danger : n.severity === 'warning' ? G.gold : G.border}`,
            borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500,
              color: n.severity === 'danger' ? G.danger : n.severity === 'warning' ? G.gold : G.text,
              marginBottom: 3 }}>{n.title}</div>
            <div style={{ fontSize: 11, color: G.accent, lineHeight: 1.5 }}>{n.message}</div>
          </div>
        ))
      }
    </Card>
  );

  const SectionSupport = () => (
    <Card>
      {[
        { title: 'Contact club admin', sub: 'Reach your club admins directly', action: <Btn size="sm">Email admin</Btn> },
        { title: 'SportSpace support',  sub: 'Platform issues, billing disputes, account recovery', action: <Btn size="sm">Open ticket</Btn> },
        { title: 'Back to dashboard',   sub: 'Return to your main dashboard', action: <Btn size="sm" onClick={() => router.push(`/dashboard/${currentRole || 'spectator'}/${user!.id}`)}>Go back</Btn> },
      ].map(row => (
        <div key={row.title} style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`,
          borderRadius: 12, padding: 16, marginBottom: 10, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{row.title}</div>
            <div style={{ fontSize: 11, color: G.accent, marginTop: 2 }}>{row.sub}</div>
          </div>
          {row.action}
        </div>
      ))}
    </Card>
  );

  const PAGE_EYEBROW: Record<NavSection, string> = {
    overview: 'Overview', memberships: 'Memberships', entrycards: 'Entry cards & rebill',
    family: 'Family members', organizations: 'Organization details', billing: 'Billing & invoices', notifications: 'Notifications', support: 'Support',
  };
  const PAGE_TITLE: Record<NavSection, string> = {
    overview: `Welcome back, ${user!.firstName ?? 'member'}`,
    memberships: 'Membership status', entrycards: 'Entry cards',
    family: 'Family & linked accounts', organizations: 'Organization details',
    billing: 'Billing history', notifications: 'Recent alerts', support: 'Get help',
  };
  const PAGE_SUB: Record<NavSection, string> = {
    overview: 'Your membership snapshot across all clubs and organizations.',
    memberships: 'All your club memberships with roles and entitlements.',
    entrycards: 'Manage access passes, court entry cards, and auto-rebill settings.',
    family: 'Manage memberships, entry cards, and access for people on your family plan.',
    organizations: 'View courts, tournaments, events, and notifications from your organization.',
    billing: 'All invoices, payments, and upcoming charges across your memberships.',
    notifications: 'Membership updates, billing alerts, and club communications.',
    support: 'Reach your club admins or the SportSpace support team.',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* ── Sidebar ── */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        background: G.surface,
        borderRight: `1px solid ${G.border}`,
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: G.green,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill={G.bg}>
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Vico Sports</div>
              <div style={{ fontSize: 11, color: G.accent, marginTop: 1 }}>Member portal</div>
            </div>
          </div>
        </div>

        <SidebarSection label="Main" />
        {NAV_MAIN.map(n => <NavItem key={n.id} {...n} badge={getBadge(n.badgeProp)} />)}

        <SidebarSection label="Finance" />
        {NAV_FINANCE.map(n => <NavItem key={n.id} {...n} badge={getBadge(n.badgeProp)} />)}

        <SidebarSection label="Account" />
        {NAV_ACCOUNT.map(n => <NavItem key={n.id} {...n} />)}

        {/* User pill */}
        <div style={{ marginTop: 'auto', padding: '16px 12px 20px', borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, marginBottom: 12, background: G.surfaceAlt, borderRadius: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: G.deep,
              border: `1px solid ${G.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700, color: G.light, flexShrink: 0 }}>
              {(user!.firstName ?? user!.email ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, color: G.text }}>{user!.firstName ?? user!.email}</div>
              <div style={{ fontSize: 11, color: G.accent }}>
                {membershipRoles.slice(0, 2).map(cap).join(' · ') || currentRole || 'Member'}
              </div>
            </div>
          </div>
          <Btn
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            style={{ width: '100%', background: '#d94f4f', color: '#fff', border: 'none' }}
          >
            Logout
          </Btn>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="main-content" style={{ background: G.bg }}>
        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zM3 9h14a1 1 0 010 2H3a1 1 0 010-2zM3 13h14a1 1 0 010 2H3a1 1 0 010-2z"/>
          </svg>
        </button>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div 
            className="sidebar-overlay open"
            onClick={() => setMobileMenuOpen(false)} 
          />
        )}

        {error ? (
          <div style={{ background: '#261111', border: `1px solid ${G.danger}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: G.text, marginBottom: 6 }}>Unable to load dashboard</div>
            <div style={{ fontSize: 13, color: G.accent }}>{error}</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: G.green, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: G.green, display: 'inline-block' }} />
                    {PAGE_EYEBROW[section]}
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 500, color: G.text, marginBottom: 4 }}>{PAGE_TITLE[section]}</h1>
                  <p style={{ fontSize: 13, color: G.accent, lineHeight: 1.5 }}>{PAGE_SUB[section]}</p>
                </div>
              </div>
            </div>
            {section === 'overview'       && <SectionOverview />}
            {section === 'memberships'    && <SectionMemberships />}
            {section === 'entrycards'     && <SectionEntryCards />}
            {section === 'family'         && <SectionFamily />}
            {section === 'organizations'  && <SectionOrganizations />}
            {section === 'billing'        && <SectionBilling />}
            {section === 'notifications'  && <SectionNotifications />}
            {section === 'support'        && <SectionSupport />}
          </>
        )}
      </div>
    </div>
  );
};

export const MemberDashboard = React.memo(MemberDashboardComponent);