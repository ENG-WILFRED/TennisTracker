import React, { useState } from 'react';
import { TournamentApplicationForm } from '@/components/tournament/TournamentApplicationForm';

interface RejectionReasonModalProps {
  registration: any;
  tournament: any;
  user: any;
  onClose: () => void;
  onReapplySuccess: () => void;
  onOpenApplyModal: () => void;
}

export function RejectionReasonModal({
  registration,
  tournament,
  user,
  onClose,
  onReapplySuccess,
  onOpenApplyModal,
}: RejectionReasonModalProps) {
  const [showReapplyForm, setShowReapplyForm] = useState(false);

  return (
    <>
      <div 
        className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" 
        onClick={onClose}
      >
        <div 
          className="bg-[#0a1510] border border-[rgba(220,76,100,0.3)] rounded-[18px] w-full max-w-[500px] overflow-hidden animate-[modalIn_0.2s_ease]" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-[rgba(220,76,100,0.2)] px-8 py-6 bg-[rgba(220,76,100,0.05)]">
            <div className="text-3xl mb-2">❌</div>
            <h2 className="text-2xl font-bold text-[#ff6b7a] mb-1">Application Rejected</h2>
            <p className="text-sm text-[#ff8a93]">Your application was not accepted</p>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Tournament Info */}
            <div>
              <div className="text-sm text-[#4a6335] font-semibold mb-2">Tournament</div>
              <div className="text-lg text-[#c8e0a8]">{tournament.name}</div>
            </div>

            {/* Rejection Reason */}
            {registration?.rejectionReason && (
              <div className="bg-[rgba(220,76,100,0.08)] border border-[rgba(220,76,100,0.2)] rounded-lg p-4">
                <div className="text-sm text-[#ff6b7a] font-semibold mb-2">Rejection Reason</div>
                <p className="text-base text-[#c8e0a8] leading-relaxed">
                  {registration.rejectionReason}
                </p>
              </div>
            )}

            {!registration?.rejectionReason && (
              <div className="bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.2)] rounded-lg p-4">
                <p className="text-base text-[#8fa878]">
                  No specific rejection reason was provided. Please contact the organizer for more information.
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.1)] rounded-lg p-4">
              <div className="text-sm text-[#4a6335] font-semibold mb-2">Next Steps</div>
              <ul className="text-sm text-[#8fa878] space-y-1">
                <li>• Review the feedback provided above</li>
                <li>• Contact the organizer if you'd like more details</li>
                <li>• Address any concerns and reapply</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-8 py-4 border-t border-[rgba(220,76,100,0.2)] bg-[rgba(220,76,100,0.02)]">
            <button 
              className="flex-1 px-4 py-2.5 rounded-lg border border-[rgba(99,153,34,0.3)] bg-transparent text-[#8dc843] hover:bg-[rgba(99,153,34,0.1)] font-semibold transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button 
              className="flex-1 px-4 py-2.5 rounded-lg bg-[linear-gradient(135deg,#3b6d11,#639922)] text-[#f0fae8] hover:brightness-110 font-semibold transition-all"
              onClick={() => {
                setShowReapplyForm(true);
                onOpenApplyModal();
              }}
            >
              🔄 Reapply
            </button>
            <button 
              className="flex-1 px-4 py-2.5 rounded-lg bg-[rgba(51,102,153,0.1)] text-[#7d9cc8] hover:bg-[rgba(51,102,153,0.2)] font-semibold transition-colors"
              onClick={() => {
                // This would open a contact modal
                alert('Contact the organizer via the "Contact Organizer" button below');
                onClose();
              }}
            >
              💬 Contact
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
