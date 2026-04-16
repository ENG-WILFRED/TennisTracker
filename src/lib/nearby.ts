import { authenticatedFetch } from './authenticatedFetch';

export function chatUrlForUser(userId: string, name: string) {
  return `/chat?targetId=${encodeURIComponent(userId)}&targetName=${encodeURIComponent(name)}`;
}

export async function sendChallengeRequest(challengerId: string, opponentId: string) {
  const response = await authenticatedFetch('/api/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengerUserId: challengerId, opponentUserId: opponentId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Unknown challenge error' }));
    throw new Error(payload?.error || 'Failed to send challenge request');
  }

  return response.json();
}
