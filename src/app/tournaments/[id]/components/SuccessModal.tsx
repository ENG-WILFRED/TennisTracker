import React from 'react';

export function SuccessModal({ onClose, type = 'registration' }: { onClose: () => void; type?: 'registration' | 'booking' }) {
  const messages = {
    registration: {
      icon: '🎉',
      title: "You're in!",
      text: "Registration confirmed. Check your email for details, schedule updates, and match notifications. Good luck!"
    },
    booking: {
      icon: '✅',
      title: "Booking Confirmed!",
      text: "Your amenity booking has been confirmed. You'll receive a confirmation email with all the details."
    }
  };

  const message = messages[type];

  return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[480px] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        {/* Success Body */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{message.icon}</div>
          <div className="text-xl font-semibold text-[#e8f8d8] mb-3">{message.title}</div>
          <p className="text-sm text-[#5a7242] leading-relaxed max-w-sm mx-auto">
            {message.text}
          </p>
        </div>
        {/* Footer */}
        <div className="flex justify-center px-5 py-4 border-t border-[rgba(99,153,34,0.15)]">
          <button className="btn btn-md btn-primary min-w-[180px]" onClick={onClose}>✓ Continue</button>
        </div>
      </div>
    </div>
  );
}