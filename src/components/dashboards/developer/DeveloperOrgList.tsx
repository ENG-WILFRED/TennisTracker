'use client';

import { useState } from 'react';
import { OrgOnboardingModal } from './OrgOnboardingModal';

interface DeveloperOrgListProps {
  organizations: any[];
  pendingOrganizations: any[];
  approvedOrganizations: any[];
  suspendedOrganizations: any[];
  rejectedOrganizations: any[];
  onOrganizationAction: (orgId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete' | 'remindPayment', rejectionReason?: string) => Promise<void>;
  onEmailOrg: (org: any) => void;
  onRefresh: () => Promise<void>;
}

export function DeveloperOrgList({
  organizations,
  pendingOrganizations,
  approvedOrganizations,
  suspendedOrganizations,
  rejectedOrganizations,
  onOrganizationAction,
  onEmailOrg,
  onRefresh,
}: DeveloperOrgListProps) {
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<{ orgId: string; action: string } | null>(null);

  const handleViewDetails = (org: any) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  };
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Summary row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-cyan-300">{organizations.length}</p>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Total Organizations</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-400">{pendingOrganizations.length}</p>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Pending Approval</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">{approvedOrganizations.length}</p>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Approved</p>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-red-400">{suspendedOrganizations.length}</p>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Suspended</p>
        </div>
      </div>

      <div className="space-y-4">
        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
            No organizations registered yet.
          </div>
        ) : (
          organizations.map((org: any) => (
            <div
              key={org.id}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                    <h3 className="text-lg font-bold text-white truncate">{org.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      org.status === 'pending'
                        ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                        : org.status === 'approved'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                        : org.status === 'suspended'
                        ? 'bg-red-950/70 text-red-300 border border-red-800/50'
                        : 'bg-slate-950/70 text-slate-400 border border-slate-800/50'
                    }`}>
                      {org.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{org.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm text-slate-500">
                    <span>📍 {org.city || '—'}, {org.country || '—'}</span>
                    <span>📧 {org.email || org.creator?.email || 'n/a'}</span>
                    <span>👤 {org.creator?.firstName ? `${org.creator.firstName} ${org.creator?.lastName || ''}` : 'Creator unknown'}</span>
                    <span>📞 {org.phone || 'n/a'}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-slate-500">
                    <span>Joined: {new Date(org.createdAt).toLocaleDateString()}</span>
                    <span>Approved: {org.approvedAt ? new Date(org.approvedAt).toLocaleDateString() : 'Not yet'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    onClick={() => handleViewDetails(org)}
                    className="rounded-xl border border-cyan-700/60 bg-cyan-900/40 hover:bg-cyan-900/60 px-4 py-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-all"
                  >
                    👁️ View Details
                  </button>
                  {org.status === 'pending' && (
                    <>
                      <button
                        onClick={async () => {
                          setLoadingAction({ orgId: org.id, action: 'approve' });
                          try {
                            await onOrganizationAction(org.id, 'approve');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction?.orgId === org.id}
                        className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 hover:bg-emerald-900/60 px-4 py-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.orgId === org.id && loadingAction?.action === 'approve' ? '⏳ Approving...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={async () => {
                          setLoadingAction({ orgId: org.id, action: 'reject' });
                          try {
                            await onOrganizationAction(org.id, 'reject');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction?.orgId === org.id}
                        className="rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.orgId === org.id && loadingAction?.action === 'reject' ? '⏳ Rejecting...' : '✗ Reject'}
                      </button>
                    </>
                  )}
                  {org.status === 'approved' && (
                    <>
                      <button
                        onClick={async () => {
                          setLoadingAction({ orgId: org.id, action: 'suspend' });
                          try {
                            await onOrganizationAction(org.id, 'suspend');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction?.orgId === org.id}
                        className="rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.orgId === org.id && loadingAction?.action === 'suspend' ? '⏳ Suspending...' : '⏸ Suspend'}
                      </button>
                      <button
                        onClick={async () => {
                          setLoadingAction({ orgId: org.id, action: 'remindPayment' });
                          try {
                            await onOrganizationAction(org.id, 'remindPayment');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction?.orgId === org.id}
                        className="rounded-xl border border-amber-700/60 bg-amber-900/40 hover:bg-amber-900/60 px-4 py-2 text-sm font-semibold text-amber-300 hover:text-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.orgId === org.id && loadingAction?.action === 'remindPayment' ? '⏳ Sending...' : '📬 Remind Payment'}
                      </button>
                    </>
                  )}
                  {org.status === 'suspended' && (
                    <>
                      <button
                        onClick={async () => {
                          setLoadingAction({ orgId: org.id, action: 'reactivate' });
                          try {
                            await onOrganizationAction(org.id, 'reactivate');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                        disabled={loadingAction?.orgId === org.id}
                        className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 hover:bg-emerald-900/60 px-4 py-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.orgId === org.id && loadingAction?.action === 'reactivate' ? '⏳ Reactivating...' : '▶️ Reactivate'}
                      </button>
                    </>
                  )}
                  {org.status === 'rejected' && (
                    <span className="rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300">
                      Closed
                    </span>
                  )}
                  {org.status !== 'approved' && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete "${org.name}"? This action cannot be undone.`)) {
                          onOrganizationAction(org.id, 'delete');
                        }
                      }}
                      className="rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrg && (
        <OrgOnboardingModal
          org={selectedOrg}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrg(null);
          }}
          onRefresh={onRefresh}
          onOrganizationAction={onOrganizationAction}
        />
      )}
    </div>
  );
}