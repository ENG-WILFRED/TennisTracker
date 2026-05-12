import { authenticatedFetch } from './authenticatedFetch';

export function chatUrlForUser(userId: string, name: string) {
  return `/chat?targetId=${encodeURIComponent(userId)}&targetName=${encodeURIComponent(name)}`;
}

export async function sendChallengeRequest(
  challengerId: string,
  opponentId: string,
  isFormal: boolean = false
) {
  const response = await authenticatedFetch('/api/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengerUserId: challengerId,
      opponentUserId: opponentId,
      isFormal,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Unknown challenge error' }));
    throw new Error(payload?.error || 'Failed to send challenge request');
  }

  return response.json();
}

export async function searchPlayers(query: string, organizationId?: string) {
  const params = new URLSearchParams({ q: query });
  if (organizationId) params.append('organizationId', organizationId);

  const response = await authenticatedFetch(`/api/players/search?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Unknown search error' }));
    throw new Error(payload?.error || 'Failed to search players');
  }

  return response.json();
}

export async function completeChallenge(
  challengeId: string,
  winnerId: string,
  score?: string
) {
  const response = await authenticatedFetch('/api/challenges/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId,
      winnerId,
      score,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(payload?.error || 'Failed to complete challenge');
  }

  return response.json();
}
