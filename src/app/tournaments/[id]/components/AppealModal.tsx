import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onAppealSubmitted: () => void;
}

export function AppealModal({ isOpen, onClose, tournamentId, onAppealSubmitted }: AppealModalProps) {
  const [appealText, setAppealText] = useState('');
  const [ruleCategory, setRuleCategory] = useState('');
  const [ruleLabel, setRuleLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appealText.trim()) {
      setError('Please enter your appeal message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(
        `/api/tournaments/${tournamentId}/appeals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleCategory: ruleCategory || null,
            ruleLabel: ruleLabel || null,
            appealText
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appeal');
      }

      onAppealSubmitted();
      onClose();
      setAppealText('');
      setRuleCategory('');
      setRuleLabel('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.12)] rounded-[14px] p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-[#e8f8d8] mb-4">Appeal a Rule</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#c8e0a8] mb-2">
              Rule Category (optional)
            </label>
            <select
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a2520] border border-[rgba(99,153,34,0.12)] rounded-lg text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
            >
              <option value="">Select a category...</option>
              <option value="scoring">Scoring</option>
              <option value="conduct">Player Conduct</option>
              <option value="equipment">Equipment</option>
              <option value="scheduling">Scheduling</option>
              <option value="registration">Registration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c8e0a8] mb-2">
              Specific Rule (optional)
            </label>
            <input
              type="text"
              value={ruleLabel}
              onChange={(e) => setRuleLabel(e.target.value)}
              placeholder="e.g., Tiebreak rules, Foot faults..."
              className="w-full px-3 py-2 bg-[#1a2520] border border-[rgba(99,153,34,0.12)] rounded-lg text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c8e0a8] mb-2">
              Your Appeal *
            </label>
            <textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Explain why you believe this rule should be changed or clarified..."
              rows={4}
              className="w-full px-3 py-2 bg-[#1a2520] border border-[rgba(99,153,34,0.12)] rounded-lg text-[#e8f8d8] focus:outline-none focus:border-[#7dc142] resize-none"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-transparent border border-[rgba(99,153,34,0.3)] text-[#7dc142] rounded-lg hover:bg-[rgba(99,153,34,0.1)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#7dc142] text-white rounded-lg hover:bg-[#6ba83a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Appeal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}