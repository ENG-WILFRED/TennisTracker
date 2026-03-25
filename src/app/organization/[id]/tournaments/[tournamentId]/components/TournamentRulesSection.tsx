"use client";

import React, { useState } from 'react';

interface TournamentRulesSectionProps {
  tournament: any;
  fetchTournamentData: () => void;
  onSaveTournament: (updates: any) => Promise<void>;
}

export function TournamentRulesSection({
  tournament,
  fetchTournamentData,
  onSaveTournament,
}: TournamentRulesSectionProps) {
  const [rulesText, setRulesText] = useState(tournament?.rules || '');
  const [savingRules, setSavingRules] = useState(false);

  const handleSaveRules = async () => {
    if (!tournament) return;

    setSavingRules(true);
    try {
      await onSaveTournament({ rules: rulesText });
      await fetchTournamentData();
    } catch (error) {
      console.error('Error saving rules:', error);
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#a8d84e',
        marginBottom: 24,
      }}>
        Rules & Regulations
      </h2>

      <div style={{
        background: 'rgba(18, 38, 18, 0.72)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(125,193,66,0.16)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#a8d84e',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          📋 Tournament Rules
        </div>

        <textarea
          value={rulesText}
          onChange={e => setRulesText(e.target.value)}
          placeholder="Enter tournament rules and regulations..."
          rows={16}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(125,193,66,0.28)',
            background: 'rgba(10,20,10,0.7)',
            color: '#e8f5e0',
            fontSize: '14px',
            boxSizing: 'border-box' as const,
            fontFamily: 'DM Sans, sans-serif',
            resize: 'vertical' as const,
          }}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSaveRules}
            disabled={savingRules}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: savingRules ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '.04em',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'opacity .2s, transform .1s',
              opacity: savingRules ? 0.5 : 1,
            }}
          >
            {savingRules ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
