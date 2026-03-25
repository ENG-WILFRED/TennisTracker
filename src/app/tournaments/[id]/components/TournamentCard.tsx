import React from 'react';
import { Tournament } from './types';
import { StatusStrip } from './StatusStrip';

export function TournamentCard({
  t, onApply, onContact, onRepost,
}: {
  t: Tournament;
  onApply: (t: Tournament) => void;
  onContact: (t: Tournament) => void;
  onRepost: (t: Tournament) => void;
}) {
  const pct = Math.round((t.currentParticipants / t.maxParticipants) * 100);
  const spotsLeft = t.maxParticipants - t.currentParticipants;
  const urgent = pct >= 85;

  return (
    <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5">
      <div className={`bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-accent ${t.status === 'completed' ? 'gray' : t.isFeatured ? 'amber' : 'green'}`} />
      {t.isFeatured && <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-featured-badge">★ Featured</div>}

      {/* Head */}
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-head">
        <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-head-left">
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badges">
            {t.status === 'open' && <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-green">Open</span>}
            {t.status === 'upcoming' && <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-amber">Upcoming</span>}
            {t.status === 'completed' && <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-gray">Completed</span>}
            {t.status === 'cancelled' && <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-red">Cancelled</span>}
            <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-blue">{t.format}</span>
            <span className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-badge-gray">{t.eventType}</span>
          </div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-name">{t.name}</div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-org">🏢 {t.organizationName}</div>
        </div>
        {t.prizePool && (
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-prize">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-prize-val">${t.prizePool.toLocaleString()}</div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-prize-lbl">prize pool</div>
          </div>
        )}
      </div>

      {/* Status Strip */}
      <StatusStrip t={t} />

      {/* Meta */}
      {t.status !== 'completed' ? (
        <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta">
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Start</div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val">{new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</div>
          </div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Location</div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val">{t.location}</div>
          </div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Entry fee</div>
            <div className={`bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val ${t.entryFee ? 'green' : ''}`}>{t.entryFee ? `$${t.entryFee}` : 'Free'}</div>
          </div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Spots left</div>
            <div className={`bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val ${urgent ? 'green' : ''}`} style={urgent ? { color: '#ef4444' } : {}}>
              {spotsLeft} / {t.maxParticipants}
            </div>
          </div>
        </div>
      ) : (
        t.myResult && (
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-result-grid">
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item"><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Rank</div><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val green">#{t.myResult.rank} of {t.myResult.total}</div></div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item"><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Wins</div><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val green">{t.myResult.wins}W</div></div>
            <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item"><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Losses</div><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val" style={{ color: '#f87171' }}>{t.myResult.losses}L</div></div>
            {t.myResult.winnings && <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-item"><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-lbl">Winnings</div><div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-meta-val green">${t.myResult.winnings}</div></div>}
          </div>
        )
      )}

      {/* Progress */}
      {t.status !== 'completed' && (
        <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-progress-wrap">
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-progress-top">
            <span>Registration progress</span>
            <span>{t.currentParticipants} / {t.maxParticipants} registered</span>
          </div>
          <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-progress-track">
            <div className={`bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-progress-fill ${urgent ? 'danger' : ''}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5 flex gap-1.5 flex-wrap">
        {t.status === 'open' && t.applicationStatus === 'none' && (
          <button className="inline-flex items-center gap-1 font-epilogue font-semibold cursor-pointer border-none transition-all duration-150 text-xs px-2 py-1.5 rounded-md bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 hover:-translate-y-0.5 disabled:bg-[#1a2e0a] disabled:text-[#334a22] disabled:cursor-not-allowed disabled:transform-none disabled:filter-none" onClick={() => onApply(t)}>📝 Apply &amp; Pay Entry</button>
        )}
        {t.applicationStatus === 'approved' && (
          <button className="btn btn-sm btn-primary" onClick={() => onApply(t)}>💳 Complete Payment</button>
        )}
        {(t.applicationStatus === 'paid' || t.status === 'completed') && (
          <button className="btn btn-sm btn-secondary">📊 View Results</button>
        )}
        <button className="btn btn-sm btn-secondary" onClick={() => onContact(t)}>✉️ Contact Organizer</button>
        <button className="btn btn-sm btn-ghost" onClick={() => onRepost(t)}>↗ Repost</button>
        {t.applicationStatus === 'none' && t.status !== 'completed' && (
          <button className="btn btn-sm btn-ghost" onClick={() => window.location.href = `/tournaments/${t.id}`}>Details</button>
        )}
        {(t.applicationStatus === 'pending' || t.applicationStatus === 'approved') && (
          <button className="btn btn-sm btn-danger">✕ Withdraw</button>
        )}
        {t.status === 'completed' && (
          <button className="btn btn-sm btn-ghost">⬇ Certificate</button>
        )}
      </div>
    </div>
  );
}