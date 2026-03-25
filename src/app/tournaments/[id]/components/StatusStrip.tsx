import React, { JSX } from 'react';
import { Tournament, ApplicationStatus } from './types';

export function StatusStrip({ t }: { t: Tournament }) {
  if (t.applicationStatus === 'none') return null;
  const map: Record<ApplicationStatus, { dot: string; text: JSX.Element } | null> = {
    none: null,
    pending: { dot: 'amber', text: <span>Application <strong>Under Review</strong> — submitted recently</span> },
    approved: { dot: 'green', text: <span>Application <strong>Approved</strong>{t.paymentDue ? ` — payment due ${t.paymentDue}` : ''}</span> },
    rejected: { dot: 'red', text: <span>Application <strong>Not Accepted</strong> — contact organizer for details</span> },
    paid: { dot: 'green', text: <span>Registered &amp; <strong>Fully Paid</strong> — see you there!</span> },
    withdrawn: { dot: 'amber', text: <span>Application <strong>Withdrawn</strong></span> },
  };
  const info = map[t.applicationStatus];
  if (!info) return null;
  return (
    <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-status-strip">
      <div className={`bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-status-dot ${info.dot}`} />
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-4 px-5 mb-4 relative overflow-hidden transition-all duration-200 hover:border-[rgba(99,153,34,0.28)] hover:-translate-y-0.5-status-text">{info.text}</div>
    </div>
  );
}