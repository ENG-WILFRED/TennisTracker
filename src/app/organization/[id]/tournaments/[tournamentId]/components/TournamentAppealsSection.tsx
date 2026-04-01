'use client';

import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface AppealItem {
  id: string;
  user: { user: { firstName: string; lastName: string; username: string } };
  ruleCategory?: string | null;
  ruleLabel?: string | null;
  appealText: string;
  status: 'pending' | 'approved' | 'denied';
  responseText?: string | null;
  respondedBy?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

interface TournamentAppealsSectionProps {
  tournamentId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  dot: '#f0c040', color: '#f0c040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.25)'  },
  approved: { label: 'Approved', dot: '#a8d84e', color: '#a8d84e', bg: 'rgba(168,216,78,0.1)',  border: 'rgba(168,216,78,0.25)'  },
  denied:   { label: 'Denied',   dot: '#f77b7b', color: '#f77b7b', bg: 'rgba(247,123,123,0.1)', border: 'rgba(247,123,123,0.25)' },
};

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AppealItem['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 100,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, color: cfg.color,
      fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot,
        boxShadow: status === 'pending' ? `0 0 5px ${cfg.dot}` : 'none',
      }} />
      {cfg.label}
    </div>
  );
}

// ── Appeal Card ───────────────────────────────────────────────────────────────
function AppealCard({
  appeal,
  draft,
  processing,
  onDraftChange,
  onDecision,
}: {
  appeal: AppealItem;
  draft: string;
  processing: boolean;
  onDraftChange: (text: string) => void;
  onDecision: (status: 'approved' | 'denied') => void;
}) {
  const name =
    appeal.user?.user?.firstName
      ? `${appeal.user.user.firstName} ${appeal.user.user.lastName || ''}`.trim()
      : appeal.user?.user?.username || 'Unknown';

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{
      borderRadius: 16,
      border: '1px solid rgba(125,193,66,0.13)',
      background: 'rgba(10, 22, 10, 0.75)',
      backdropFilter: 'blur(16px)',
      overflow: 'hidden',
    }}>
      {/* Card top bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(125,193,66,0.08)',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(0,0,0,0.2)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'linear-gradient(135deg,#2c5a10,#4a9020)',
          border: '1px solid rgba(125,193,66,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800,
          color: '#a8d84e', flexShrink: 0,
        }}>
          {initials}
        </div>

        {/* Name + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
            color: '#dff0c8', lineHeight: 1.2,
          }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: '#567a30', marginTop: 2 }}>
            {timeAgo(appeal.createdAt)}
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={appeal.status} />
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

        {/* Appeal text */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
            textTransform: 'uppercase' as const, color: '#567a30',
            fontFamily: 'Syne, sans-serif', marginBottom: 6,
          }}>
            Appeal
          </div>
          <p style={{
            margin: 0, fontSize: 14, color: '#dff0c8',
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65,
          }}>
            {appeal.appealText}
          </p>
        </div>

        {/* Rule tags */}
        {(appeal.ruleCategory || appeal.ruleLabel) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {appeal.ruleCategory && (
              <RuleTag label="Category" value={appeal.ruleCategory} />
            )}
            {appeal.ruleLabel && (
              <RuleTag label="Rule" value={appeal.ruleLabel} />
            )}
          </div>
        )}

        {/* Existing response */}
        {appeal.responseText && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: appeal.status === 'approved'
              ? 'rgba(168,216,78,0.07)'
              : appeal.status === 'denied'
              ? 'rgba(247,123,123,0.07)'
              : 'rgba(125,193,66,0.05)',
            border: `1px solid ${
              appeal.status === 'approved'
                ? 'rgba(168,216,78,0.2)'
                : appeal.status === 'denied'
                ? 'rgba(247,123,123,0.2)'
                : 'rgba(125,193,66,0.12)'
            }`,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
              textTransform: 'uppercase' as const, color: '#567a30',
              fontFamily: 'Syne, sans-serif', marginBottom: 5,
            }}>
              Response
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#c8e8a0', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
              {appeal.responseText}
            </p>
            {appeal.respondedBy && (
              <div style={{ fontSize: 11, color: '#456630', marginTop: 6 }}>
                by {appeal.respondedBy}{appeal.respondedAt ? ` · ${timeAgo(appeal.respondedAt)}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Pending actions */}
        {appeal.status === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
              textTransform: 'uppercase' as const, color: '#567a30',
              fontFamily: 'Syne, sans-serif',
            }}>
              Decision Reason
            </div>
            <input
              value={draft}
              onChange={e => onDraftChange(e.target.value)}
              placeholder="Provide a reason for your decision…"
              style={{
                width: '100%', boxSizing: 'border-box' as const,
                padding: '10px 14px',
                borderRadius: 9,
                border: '1px solid rgba(125,193,66,0.22)',
                background: 'rgba(6,14,6,0.7)',
                color: '#e8f5e0', fontSize: 13,
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none', caretColor: '#a8d84e',
              }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <DecisionBtn
                label={processing ? 'Saving…' : 'Deny'}
                disabled={processing || !draft.trim()}
                onClick={() => onDecision('denied')}
                variant="deny"
              />
              <DecisionBtn
                label={processing ? 'Saving…' : 'Approve'}
                disabled={processing || !draft.trim()}
                onClick={() => onDecision('approved')}
                variant="approve"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RuleTag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 7,
      background: 'rgba(125,193,66,0.07)',
      border: '1px solid rgba(125,193,66,0.16)',
    }}>
      <span style={{ fontSize: 10, color: '#567a30', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: '#a8d84e', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function DecisionBtn({
  label, disabled, onClick, variant,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant: 'approve' | 'deny';
}) {
  const [hov, setHov] = useState(false);
  const isApprove = variant === 'approve';

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 20px',
        borderRadius: 9,
        border: isApprove
          ? '1px solid rgba(168,216,78,0.35)'
          : '1px solid rgba(247,123,123,0.3)',
        background: disabled
          ? 'rgba(125,193,66,0.05)'
          : isApprove
          ? hov ? 'linear-gradient(135deg,#5aa820,#a8d84e)' : 'rgba(125,193,66,0.12)'
          : hov ? '#c0393d' : 'rgba(247,123,123,0.1)',
        color: disabled
          ? '#3d5c22'
          : isApprove
          ? hov ? '#071407' : '#a8d84e'
          : hov ? '#fff' : '#f77b7b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12, fontWeight: 700,
        fontFamily: 'Syne, sans-serif',
        letterSpacing: '0.07em',
        textTransform: 'uppercase' as const,
        transition: 'all 0.18s',
        boxShadow: !disabled && hov
          ? isApprove ? '0 3px 12px rgba(90,168,32,0.3)' : '0 3px 12px rgba(192,57,61,0.35)'
          : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TournamentAppealsSection({ tournamentId }: TournamentAppealsSectionProps) {
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  const loadAppeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`/api/tournaments/${tournamentId}/appeals`, { method: 'GET' });
      if (!res.ok) throw new Error(`Failed to fetch appeals (${res.status})`);
      setAppeals(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch appeals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppeals(); }, [tournamentId]);

  const handleDecision = async (appealId: string, status: 'approved' | 'denied') => {
    const text = (drafts[appealId] || '').trim();
    if (!text) { setError('Please provide a decision reason'); return; }

    setProcessing(p => ({ ...p, [appealId]: true }));
    setError(null);
    try {
      const res = await authenticatedFetch(`/api/tournaments/${tournamentId}/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseText: text }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || `Failed to ${status} appeal`);
      }
      await loadAppeals();
      setDrafts(d => ({ ...d, [appealId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setProcessing(p => ({ ...p, [appealId]: false }));
    }
  };

  const counts = {
    all: appeals.length,
    pending: appeals.filter(a => a.status === 'pending').length,
    approved: appeals.filter(a => a.status === 'approved').length,
    denied: appeals.filter(a => a.status === 'denied').length,
  };

  const visible = filter === 'all' ? appeals : appeals.filter(a => a.status === filter);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }}>
        <div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800,
            color: '#a8d84e', margin: 0, letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            Appeals
          </h2>
        </div>

        {/* Reload */}
        <button
          onClick={loadAppeals}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            background: 'rgba(125,193,66,0.08)',
            border: '1px solid rgba(125,193,66,0.2)',
            color: '#7dc142', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em',
            opacity: loading ? 0.5 : 1, transition: 'opacity 0.18s',
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: loading ? 'spin 0.8s linear infinite' : 'none',
          }}>↻</span>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        padding: '6px', borderRadius: 12,
        background: 'rgba(10,22,10,0.7)',
        border: '1px solid rgba(125,193,66,0.1)',
        width: 'fit-content',
      }}>
        {(['all', 'pending', 'approved', 'denied'] as const).map(tab => {
          const active = filter === tab;
          const cfg = tab === 'all' ? null : STATUS_CONFIG[tab];
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: active
                  ? cfg ? cfg.bg : 'rgba(125,193,66,0.12)'
                  : 'transparent',
                border: active
                  ? `1px solid ${cfg ? cfg.border : 'rgba(125,193,66,0.25)'}`
                  : '1px solid transparent',
                color: active
                  ? cfg ? cfg.color : '#a8d84e'
                  : '#456630',
                cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em',
                textTransform: 'capitalize' as const,
                transition: 'all 0.15s',
              }}
            >
              {tab}
              <span style={{
                padding: '1px 6px', borderRadius: 5,
                background: active
                  ? cfg ? cfg.border : 'rgba(125,193,66,0.2)'
                  : 'rgba(125,193,66,0.06)',
                fontSize: 10, fontWeight: 800,
                color: active ? (cfg ? cfg.color : '#a8d84e') : '#456630',
              }}>
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error bar */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 9,
          background: 'rgba(247,123,123,0.08)', border: '1px solid rgba(247,123,123,0.25)',
          fontSize: 13, color: '#f77b7b', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '36px 0', justifyContent: 'center',
          color: '#567a30', fontSize: 13,
        }}>
          <span style={{
            width: 14, height: 14, border: '2px solid #567a30',
            borderTopColor: '#a8d84e', borderRadius: '50%',
            display: 'inline-block', animation: 'spin 0.7s linear infinite',
          }} />
          Loading appeals…
        </div>
      )}

      {/* Empty state */}
      {!loading && visible.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column' as const,
          alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '56px 20px',
          background: 'rgba(10,22,10,0.6)',
          border: '1px solid rgba(125,193,66,0.1)',
          borderRadius: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            border: '1px dashed rgba(125,193,66,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, opacity: 0.4,
          }}>⚖️</div>
          <p style={{ margin: 0, color: '#456630', fontSize: 13, textAlign: 'center' as const }}>
            {filter === 'all' ? 'No appeals submitted yet.' : `No ${filter} appeals.`}
          </p>
        </div>
      )}

      {/* Appeals list */}
      {!loading && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {visible.map(appeal => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              draft={drafts[appeal.id] || ''}
              processing={!!processing[appeal.id]}
              onDraftChange={text => setDrafts(d => ({ ...d, [appeal.id]: text }))}
              onDecision={status => handleDecision(appeal.id, status)}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}