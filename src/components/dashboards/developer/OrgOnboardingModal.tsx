'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface OrgOnboardingModalProps {
  org: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onOrganizationAction: (orgId: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete', rejectionReason?: string) => Promise<void>;
}

export function OrgOnboardingModal({ org, isOpen, onClose, onRefresh, onOrganizationAction }: OrgOnboardingModalProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'email' | 'payments' | 'communications'>('details');
  const [installationFee, setInstallationFee] = useState(5000);
  const [monthlySubscription, setMonthlySubscription] = useState(1500);
  const [emailSubject, setEmailSubject] = useState('TennisTracker Onboarding - Pricing & Agreement');
  const [emailBody, setEmailBody] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [communications, setCommunications] = useState<any[]>([]);
  const [isLoadingCommunications, setIsLoadingCommunications] = useState(false);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = installationFee + (monthlySubscription * 12) - totalPaid;

  // Load payment history and communications when modal opens
  useEffect(() => {
    if (isOpen && org?.id) {
      setIsLoadingPayments(true);
      setIsLoadingCommunications(true);

      // Load payments
      authenticatedFetch(`/api/developer/organizations/${org.id}/payments`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setPayments(data.payments || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load payments:', err);
        })
        .finally(() => {
          setIsLoadingPayments(false);
        });

      // Load communications (notifications sent to developers)
      authenticatedFetch(`/api/developer/organizations/${org.id}/communications`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setCommunications(data.communications || []);
          }
        })
        .catch((err) => {
          console.error('Failed to load communications:', err);
        })
        .finally(() => {
          setIsLoadingCommunications(false);
        });
    }
  }, [isOpen, org?.id]);

  if (!isOpen) return null;

  const handleSendEmail = useCallback(async () => {
    if (!emailBody.trim()) {
      addToast('Please write an email message', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/developer/organizations/${org.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          installationFee,
          monthlySubscription,
        }),
      });

      if (response.ok) {
        addToast('Email sent successfully', 'success');
        setEmailBody('');
      } else {
        const error = await response.json();
        addToast(`Failed to send email: ${error.error}`, 'error');
      }
    } catch (err) {
      addToast('Failed to send email', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [org.id, emailSubject, emailBody, installationFee, monthlySubscription, addToast]);

  const handleAddPayment = useCallback(async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/developer/organizations/${org.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          notes: paymentNotes,
        }),
      });

      if (response.ok) {
        const newPayment = await response.json();
        setPayments([newPayment, ...payments]);
        setPaymentAmount('');
        setPaymentNotes('');
        addToast('Payment recorded successfully', 'success');
        await onRefresh();
      } else {
        const error = await response.json();
        addToast(`Failed to record payment: ${error.error}`, 'error');
      }
    } catch (err) {
      addToast('Failed to record payment', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [org.id, paymentAmount, paymentNotes, payments, addToast, onRefresh]);

  const handleSendPaymentReminder = useCallback(async () => {
    const recipient = org.email || org.createdBy?.email;
    if (!recipient) {
      addToast('No email address available for this organization', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/developer/organizations/${org.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Payment Reminder - TennisTracker Organization`,
          body: `Dear ${org.creator?.firstName || 'Valued Customer'},

This is a friendly reminder regarding your outstanding balance for the TennisTracker organization "${org.name}".

Current Account Summary:
- Installation Fee: $${installationFee}
- Monthly Subscription: $${monthlySubscription} (annual total: $${monthlySubscription * 12})
- Total Amount Due: $${installationFee + (monthlySubscription * 12)}
- Amount Paid: $${totalPaid}
- Remaining Balance: $${remainingBalance}

Please arrange payment at your earliest convenience to ensure continued access to all TennisTracker features.

If you have any questions or need assistance with payment arrangements, please don't hesitate to contact our support team.

Best regards,
TennisTracker Development Team`,
          installationFee,
          monthlySubscription,
        }),
      });

      if (response.ok) {
        addToast('Payment reminder sent successfully', 'success');
      } else {
        const error = await response.json();
        addToast(`Failed to send payment reminder: ${error.error}`, 'error');
      }
    } catch (err) {
      addToast('Failed to send payment reminder', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [org, installationFee, monthlySubscription, totalPaid, remainingBalance, addToast]);

  const handleRevokeAccess = useCallback(async () => {
    if (!confirm('Are you sure you want to revoke access for this organization?')) return;

    setIsLoading(true);
    try {
      await onOrganizationAction(org.id, 'suspend');
      await onRefresh();
      onClose();
    } catch (err) {
      addToast('Failed to revoke access', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [org.id, addToast, onRefresh, onClose, onOrganizationAction]);

  const handleOrganizationAction = useCallback(
    async (action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete') => {
      setIsLoading(true);
      try {
        await onOrganizationAction(org.id, action);
        await onRefresh();
      } catch (err) {
        addToast(`Failed to ${action} organization`, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [org.id, addToast, onOrganizationAction, onRefresh]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-800 bg-slate-950/95 backdrop-blur p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{org.name}</h2>
              <p className="mt-1 text-sm text-slate-400">Organization Onboarding</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg hover:bg-slate-800 p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 border-b border-slate-800">
            {(['details', 'email', 'payments', 'communications'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold text-sm transition capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-cyan-500 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab === 'details' && '📋 Details'}
                {tab === 'email' && '✉️ Email'}
                {tab === 'payments' && '💰 Payments'}
                {tab === 'communications' && '💬 Communications'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Organization Name
                  </label>
                  <p className="text-white font-semibold">{org.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Status
                  </label>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    org.status === 'pending' ? 'bg-amber-950/70 text-amber-400'
                    : org.status === 'approved' ? 'bg-emerald-950/70 text-emerald-300'
                    : 'bg-red-950/70 text-red-300'
                  }`}>
                    {org.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Email
                  </label>
                  <p className="text-slate-300">{org.email || org.creator?.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Phone
                  </label>
                  <p className="text-slate-300">{org.phone || '—'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Location
                  </label>
                  <p className="text-slate-300">{org.city}, {org.country}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Contact Person
                  </label>
                  <p className="text-slate-300">{org.creator?.firstName} {org.creator?.lastName}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </label>
                <p className="text-slate-300 text-sm">{org.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Joined Date
                  </label>
                  <p className="text-slate-300">{new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Approved Date
                  </label>
                  <p className="text-slate-300">{org.approvedAt ? new Date(org.approvedAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {org.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOrganizationAction('approve')}
                      disabled={isLoading}
                      className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-all disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrganizationAction('reject')}
                      disabled={isLoading}
                      className="rounded-xl border border-red-700/60 bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/60 transition-all disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                {org.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleOrganizationAction('suspend')}
                    disabled={isLoading}
                    className="rounded-xl border border-red-700/60 bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/60 transition-all disabled:opacity-50"
                  >
                    ⏸ Suspend
                  </button>
                )}
                {org.status === 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleOrganizationAction('reactivate')}
                    disabled={isLoading}
                    className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-all disabled:opacity-50"
                  >
                    ▶️ Reactivate
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete "${org.name}"? This action cannot be undone and will remove all associated data.`)) {
                      handleOrganizationAction('delete');
                      onClose();
                    }
                  }}
                  disabled={isLoading}
                  className="rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-all disabled:opacity-50"
                >
                  🗑️ Delete Organization
                </button>
              </div>

              {org.status === 'approved' && (
                <button
                  onClick={handleRevokeAccess}
                  disabled={isLoading}
                  className="w-full mt-6 rounded-xl border border-red-700/60 bg-red-900/40 hover:bg-red-900/60 px-4 py-3 font-semibold text-red-300 hover:text-red-200 transition-all disabled:opacity-50"
                >
                  {isLoading ? '⏳ Revoking...' : '🔒 Revoke Access'}
                </button>
              )}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="font-semibold text-slate-300 mb-3">Pricing Terms</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Installation Fee
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">$</span>
                      <input
                        type="number"
                        value={installationFee}
                        onChange={(e) => setInstallationFee(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Monthly Subscription
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">$</span>
                      <input
                        type="number"
                        value={monthlySubscription}
                        onChange={(e) => setMonthlySubscription(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Dear [Organization Name], ..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white focus:border-cyan-500 outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={isLoading}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-3 font-semibold text-white transition-all disabled:opacity-50"
              >
                {isLoading ? '⏳ Sending...' : '📤 Send Email'}
              </button>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3 text-center">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Annual Cost</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    ${installationFee + (monthlySubscription * 12)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-400">${totalPaid}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ${remainingBalance}
                  </p>
                </div>
              </div>

              {/* Add Payment */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <h3 className="font-semibold text-slate-300">Record Payment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Amount
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">$</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g., Monthly subscription for May"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-semibold text-white transition-all disabled:opacity-50"
                >
                  {isLoading ? '⏳ Recording...' : '✓ Record Payment'}
                </button>
              </div>

              {/* Payment Reminder */}
              {remainingBalance > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                  <h3 className="font-semibold text-slate-300">Payment Reminder</h3>
                  <p className="text-sm text-slate-400">
                    Send a payment reminder to the organization for the outstanding balance of ${remainingBalance}.
                  </p>
                  <button
                    onClick={handleSendPaymentReminder}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Sending...' : '📧 Send Payment Reminder'}
                  </button>
                </div>
              )}

              {/* Payment History */}
              {isLoadingPayments ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
                  <div className="w-8 h-8 mx-auto rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-3" />
                  <p className="text-slate-400 text-sm">Loading payment history...</p>
                </div>
              ) : payments.length > 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <h3 className="font-semibold text-slate-300 mb-3">Payment History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payments.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 border-b border-slate-800 last:border-0">
                        <div>
                          <p className="text-slate-300 font-semibold">${payment.amount}</p>
                          {payment.notes && <p className="text-xs text-slate-500">{payment.notes}</p>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
                  <p className="text-slate-400 text-sm">No payments recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="font-semibold text-slate-300 mb-3">Communication History</h3>
                <p className="text-sm text-slate-400 mb-4">
                  View all communications between this organization and the development team.
                </p>

                {isLoadingCommunications ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <div className="w-8 h-8 mx-auto rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm">Loading communications...</p>
                  </div>
                ) : communications.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {communications.map((comm, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              comm.direction === 'from_org'
                                ? 'bg-blue-950/70 text-blue-300'
                                : 'bg-green-950/70 text-green-300'
                            }`}>
                              {comm.direction === 'from_org' ? '📨 From Org' : '📤 To Org'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {comm.type === 'notification' ? 'Notification' : 'Email'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(comm.createdAt).toLocaleDateString()} {new Date(comm.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-300 mb-1">{comm.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{comm.body}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>From: {comm.sender}</span>
                          <span>To: {comm.recipient}</span>
                        </div>
                        {comm.eventType && (
                          <div className="mt-2 text-xs text-slate-500">
                            Event: {comm.eventType.replace(/_/g, ' ')}
                          </div>
                        )}
                        {comm.status && (
                          <div className="mt-2 text-xs text-slate-500">
                            Status: {comm.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
                    <p className="text-slate-400 text-sm">No communications found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
