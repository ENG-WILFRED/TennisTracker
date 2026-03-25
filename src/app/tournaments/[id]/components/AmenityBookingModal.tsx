import React, { useState } from 'react';

export function AmenityBookingModal({ amenity, onClose, onConfirm, loading }: { amenity: any; onClose: () => void; onConfirm: (data: any) => void; loading: boolean }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'paypal' | 'stripe'>('card');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      alert('Please select start and end times');
      return;
    }

    // Validate mobile number if paying with M-Pesa
    if (amenity?.price && paymentMethod === 'mobile') {
      if (!mobileNumber || !mobileNumber.match(/^254\d{9}$/)) {
        alert('Invalid mobile number. Please use format: 254XXXXXXXXX');
        return;
      }
    }

    onConfirm({
      startTime,
      endTime,
      guestName: guestName || null,
      notes: notes || null,
      paymentMethod,
      mobileNumber,
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[480px] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(99,153,34,0.16)]">
          <div className="text-3xl mb-2">🏨</div>
          <h3 className="text-lg font-semibold text-[#e8f8d8] mb-1">Book {amenity?.name}</h3>
          <p className="text-sm text-[#5a7242]">Reserve your spot for tournament amenities</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Amenity Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Amenity Details</label>
              <div className="bg-[rgba(99,153,34,0.06)] border border-[rgba(99,153,34,0.15)] rounded-lg p-3 space-y-2">
                <div className="font-semibold text-[#c8e0a8]">{amenity?.name}</div>
                {amenity?.description && (
                  <div className="text-xs text-[#5a7242]">{amenity.description}</div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-[#4a6335]">
                    Price: <span className="text-[#8dc843] font-semibold">${amenity?.price || 'Free'}</span>
                  </span>
                  <span className="text-[#4a6335]">Capacity: {amenity?.capacity || 'Unlimited'}</span>
                </div>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Start Time</label>
              <input
                type="datetime-local"
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)]"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">End Time</label>
              <input
                type="datetime-local"
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)]"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            {/* Guest Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Guest Name <span className="text-[#5a7242] font-normal">(optional)</span></label>
              <input
                type="text"
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)]"
                placeholder="Enter guest name if booking for someone else"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Notes <span className="text-[#5a7242] font-normal">(optional)</span></label>
              <textarea
                className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] min-h-[80px] resize-none"
                placeholder="Any special requests or notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Payment Method (if amenity has price) */}
            {amenity?.price && amenity.price > 0 && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'card', label: '💳 Card (Stripe)' },
                      { key: 'mobile', label: '📱 M-Pesa' },
                      { key: 'paypal', label: '🅿️ PayPal' },
                      { key: 'stripe', label: '⚡ Stripe' },
                    ].map((option) => (
                      <label
                        key={option.key}
                        className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors text-sm ${paymentMethod === option.key
                          ? 'border-[#8dc843] bg-[rgba(99,153,34,0.12)]'
                          : 'border-[rgba(99,153,34,0.12)] bg-transparent hover:border-[rgba(99,153,34,0.25)]'
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.key}
                          checked={paymentMethod === option.key}
                          onChange={() => setPaymentMethod(option.key as 'card' | 'mobile' | 'paypal' | 'stripe')}
                          className="accent-[#8dc843]"
                        />
                        <span className="text-[#dde8d4]">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile Number Input (if M-Pesa selected) */}
                {paymentMethod === 'mobile' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="254XXXXXXXXX"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.2)] rounded-lg px-3 py-2 text-[#dde8d4] placeholder-[#5a7242] focus:outline-none focus:border-[#8dc843] text-sm"
                    />
                    <p className="text-xs text-[#5a7242] mt-1">Format: 254XXXXXXXXX (Kenya)</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-[rgba(99,153,34,0.15)]">
            <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}