"use client";
import React from 'react';
import useKnockout from './useKnockout';
import KnockoutClient from './KnockoutClient';

export default function KnockoutContainer() {
  const hook = useKnockout();

  return (
    <KnockoutClient
      players={hook.players}
      matches={hook.matches}
      standings={hook.standings}
      scores={hook.scores}
      tiebreaks={hook.tiebreaks}
      winners={hook.winners}
      stage={hook.stage}
      loading={hook.loading}
      toast={hook.toast}
      allGroupMatchesHaveWinner={hook.allGroupMatchesHaveWinner}
      onPointChange={hook.handlePointCheckbox}
      onTiebreakChange={hook.handleTiebreakCheckbox}
      onConfirmWinner={hook.handleConfirmWinner}
      onProceedToSemis={hook.handleProceedToSemis}
      onProceedToFinals={hook.handleProceedToFinals}
    />
  );
}
