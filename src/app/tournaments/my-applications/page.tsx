'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { PaymentAfterApprovalModal } from '@/components/tournament/PaymentAfterApprovalModal';

interface Application {
  id: string;
  eventId: string;
  status: 'pending' | 'approved' | 'rejected' | 'registered';
  createdAt: string;
  rejectionReason?: string;
  event: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    entryFee: number;
  };
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      router.push('/');
      return;
    }

    fetchApplications();
  }, [user?.id]);

  const fetchApplications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/user/tournament-applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedApp(null);
    await fetchApplications();
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const approvedApps = applications.filter((a) => a.status === 'approved');
  const rejectedApps = applications.filter((a) => a.status === 'rejected');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(240,192,64,0.1)', border: 'rgba(240,192,64,0.3)', text: '#f0c040' };
      case 'approved':
        return { bg: 'rgba(125,193,66,0.1)', border: 'rgba(125,193,66,0.3)', text: '#a8d84e' };
      case 'rejected':
        return { bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.3)', text: '#ff6b6b' };
      default:
        return { bg: 'rgba(125,193,66,0.1)', border: 'rgba(125,193,66,0.3)', text: '#a8d84e' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending Review';
      case 'approved':
        return '✅ Approved';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050d08', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: '#a8d84e', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050d08',
        color: '#dff0d0',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#a8d84e',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#c8f07a',
              margin: '0 0 8px 0',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            My Tournament Applications
          </h1>
          <p style={{ fontSize: '14px', color: '#8fa878', margin: 0 }}>
            Track your tournament applications and manage payments
          </p>
        </div>

        {/* Applications */}
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Pending Applications */}
          {pendingApps.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#f0c040',
                  marginBottom: '16px',
                  fontFamily: 'Syne, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ⏳ Pending Applications
                <span
                  style={{
                    background: '#f0c040',
                    color: '#0a160a',
                    borderRadius: '99px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {pendingApps.length}
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {pendingApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} status="pending" />
                ))}
              </div>
            </section>
          )}

          {/* Approved Applications */}
          {approvedApps.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#a8d84e',
                  marginBottom: '16px',
                  fontFamily: 'Syne, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ✅ Approved Applications
                <span
                  style={{
                    background: 'rgba(125,193,66,0.2)',
                    color: '#a8d84e',
                    borderRadius: '99px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {approvedApps.length}
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {approvedApps.map((app) => (
                  <div key={app.id}>
                    <ApplicationCard app={app} status="approved" />
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowPaymentModal(true);
                      }}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg,#5aa820,#7dc142)',
                        color: '#0a160a',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      Proceed to Payment ${app.event.entryFee.toFixed(2)}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rejected Applications */}
          {rejectedApps.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ff6b6b',
                  marginBottom: '16px',
                  fontFamily: 'Syne, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ❌ Rejected Applications
                <span
                  style={{
                    background: 'rgba(255,107,107,0.2)',
                    color: '#ff6b6b',
                    borderRadius: '99px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {rejectedApps.length}
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {rejectedApps.map((app) => (
                  <ApplicationCard key={app.id} app={app} status="rejected" />
                ))}
              </div>
            </section>
          )}

          {/* No Applications */}
          {applications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎾</div>
              <p style={{ fontSize: '16px', color: '#dff0d0', margin: '0 0 8px 0' }}>
                No tournament applications yet
              </p>
              <p style={{ fontSize: '13px', color: '#8fa878', margin: 0 }}>
                Visit tournaments and apply to get started
              </p>
              <button
                onClick={() => router.push('/tournaments')}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  background: 'rgba(125,193,66,0.15)',
                  color: '#a8d84e',
                  border: '1px solid rgba(125,193,66,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Browse Tournaments
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedApp && user?.id && (
        <PaymentAfterApprovalModal
          tournament={selectedApp.event}
          registration={{ id: selectedApp.id }}
          user={user}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedApp(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

interface ApplicationCardProps {
  app: Application;
  status: 'pending' | 'approved' | 'rejected';
}

function ApplicationCard({ app, status }: ApplicationCardProps) {
  const colors = {
    pending: { bg: 'rgba(240,192,64,0.1)', border: 'rgba(240,192,64,0.3)', text: '#f0c040' },
    approved: { bg: 'rgba(125,193,66,0.1)', border: 'rgba(125,193,66,0.3)', text: '#a8d84e' },
    rejected: { bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.3)', text: '#ff6b6b' },
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return '⏳ Pending Review';
      case 'approved':
        return '✅ Approved';
      case 'rejected':
        return '❌ Rejected';
    }
  };

  const color = colors[status];

  return (
    <div
      style={{
        background: 'rgba(18, 38, 18, 0.72)',
        border: `1px solid ${color.border}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'grid',
        gap: '12px',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#dff0d0', margin: '0 0 8px 0' }}>
            {app.event.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#8fa878', margin: '0 0 8px 0' }}>
            {app.event.description}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#6a9058' }}>Applied: </span>
              <span style={{ color: '#dff0d0' }}>
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span style={{ color: '#6a9058' }}>Entry Fee: </span>
              <span style={{ color: '#a8d84e', fontWeight: 700 }}>${app.event.entryFee.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div
          style={{
            background: color.bg,
            border: `1px solid ${color.border}`,
            color: color.text,
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {getStatusLabel()}
        </div>
      </div>
      {status === 'rejected' && app.rejectionReason && (
        <div
          style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: '8px',
            padding: '12px',
            display: 'grid',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b6b' }}>
            Rejection Reason:
          </div>
          <div style={{ fontSize: '12px', color: '#dff0d0', lineHeight: '1.5' }}>
            {app.rejectionReason}
          </div>
        </div>
      )}
    </div>
  );
}
