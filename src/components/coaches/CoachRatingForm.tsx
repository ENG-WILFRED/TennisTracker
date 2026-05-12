'use client';

import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { X, Send, Star } from 'lucide-react';

interface CoachRatingFormProps {
  coachId: string;
  playerId: string;
  sessionId?: string;
  sessionTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const G = {
  page: '#081107',
  card: '#0f1f0f',
  cardSoft: '#152515',
  cardBorder: '#243e24',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  accent: '#79bf3e',
  accentSoft: '#79bf3e22',
  warning: '#f0c040',
  danger: '#d94f4f',
};

export const CoachRatingForm: React.FC<CoachRatingFormProps> = ({
  coachId,
  playerId,
  sessionId,
  sessionTitle = 'Training Session',
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState({
    overallRating: 4,
    techniquRating: 4,
    mentalRating: 4,
    fitnessRating: 4,
    teamworkRating: 4,
    strengths: '',
    areasForImprovement: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = useCallback(
    (field: string, value: number | string) => {
      setRating((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!coachId || !playerId) {
        toast.error('Missing coach or player information');
        return;
      }

      if (!rating.strengths.trim() || !rating.areasForImprovement.trim()) {
        toast.error(
          'Please provide both strengths and areas for improvement'
        );
        return;
      }

      setSubmitting(true);

      try {
        const response = await fetch('/api/coaches/rate-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachId,
            playerId,
            sessionId,
            overallRating: rating.overallRating,
            techniquRating: rating.techniquRating,
            mentalRating: rating.mentalRating,
            fitnessRating: rating.fitnessRating,
            teamworkRating: rating.teamworkRating,
            strengths: rating.strengths.trim(),
            areasForImprovement: rating.areasForImprovement.trim(),
            notes: rating.notes.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to submit rating');
        }

        toast.success('Player rating submitted successfully!');
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error('Rating submission error:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to submit rating'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [coachId, playerId, sessionId, rating, onSuccess, onClose]
  );

  const StarRating = ({
    label,
    field,
    value,
  }: {
    label: string;
    field: string;
    value: number;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-white mb-2">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(field, star)}
            className="transition-all"
            style={{
              color: star <= value ? G.warning : G.muted,
              cursor: 'pointer',
            }}
          >
            <Star
              className={`h-6 w-6 ${
                star <= value ? 'fill-current' : ''
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        style={{
          background: G.card,
          border: `1px solid ${G.cardBorder}`,
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: `1px solid ${G.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 className="text-xl font-bold text-white">Rate Player</h2>
            <p style={{ fontSize: '12px', color: G.muted, marginTop: '4px' }}>
              {sessionTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#243e24] rounded-lg transition"
          >
            <X className="h-5 w-5 text-[#a8d84e]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Performance Ratings */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white uppercase mb-4">
              Performance Ratings
            </h3>

            <StarRating
              label="Overall Performance"
              field="overallRating"
              value={rating.overallRating}
            />
            <StarRating
              label="Technique & Skills"
              field="techniquRating"
              value={rating.techniquRating}
            />
            <StarRating
              label="Mental Toughness"
              field="mentalRating"
              value={rating.mentalRating}
            />
            <StarRating
              label="Fitness & Stamina"
              field="fitnessRating"
              value={rating.fitnessRating}
            />
            <StarRating
              label="Teamwork & Attitude"
              field="teamworkRating"
              value={rating.teamworkRating}
            />
          </div>

          {/* Text Fields */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Strengths
            </label>
            <textarea
              value={rating.strengths}
              onChange={(e) =>
                handleRatingChange('strengths', e.target.value)
              }
              placeholder="What did the player do well?"
              style={{
                width: '100%',
                padding: '10px',
                background: G.cardSoft,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '8px',
                color: G.text,
                fontSize: '13px',
                minHeight: '80px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Areas for Improvement
            </label>
            <textarea
              value={rating.areasForImprovement}
              onChange={(e) =>
                handleRatingChange('areasForImprovement', e.target.value)
              }
              placeholder="What can the player work on?"
              style={{
                width: '100%',
                padding: '10px',
                background: G.cardSoft,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '8px',
                color: G.text,
                fontSize: '13px',
                minHeight: '80px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Additional Notes
            </label>
            <textarea
              value={rating.notes}
              onChange={(e) => handleRatingChange('notes', e.target.value)}
              placeholder="Any other feedback or observations..."
              style={{
                width: '100%',
                padding: '10px',
                background: G.cardSoft,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '8px',
                color: G.text,
                fontSize: '13px',
                minHeight: '60px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: `1px solid ${G.cardBorder}`,
                borderRadius: '8px',
                color: G.text,
                fontSize: '13px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px',
                background: G.accent,
                border: 'none',
                borderRadius: '8px',
                color: '#081107',
                fontSize: '13px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachRatingForm;
