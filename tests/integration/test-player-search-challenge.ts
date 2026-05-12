import fetch from 'node-fetch';

async function main() {
  const baseUrl = 'http://localhost:3020';
  console.log('Testing player search endpoint...');

  try {
    const searchResponse = await fetch(`${baseUrl}/api/players/search?q=elena`);
    console.log('Search status:', searchResponse.status);
    const searchJson = await searchResponse.json();
    console.log('Search response keys:', Object.keys(searchJson));

    if (!searchResponse.ok) {
      console.error('Search endpoint returned an error:', searchJson);
    } else {
      console.log('Search results count:', Array.isArray(searchJson.results) ? searchJson.results.length : 'unknown');
      if (Array.isArray(searchJson.results) && searchJson.results.length > 0) {
        const result = searchJson.results[0];
        console.log('First player result:', {
          userId: result.userId,
          email: result.email,
          username: result.username,
          name: result.name,
        });
      }
    }
  } catch (error) {
    console.error('Failed to test player search:', error);
  }

  console.log('\nTesting challenge endpoint validation...');
  try {
    const challengeResponse = await fetch(`${baseUrl}/api/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengerUserId: 'test-user', opponentUserId: 'test-user' }),
    });
    console.log('Challenge status:', challengeResponse.status);
    const challengeJson = await challengeResponse.json();
    console.log('Challenge response:', challengeJson);
    if (challengeResponse.status !== 400) {
      console.error('Expected validation error when challenging yourself.');
    }
  } catch (error) {
    console.error('Failed to test challenge endpoint:', error);
  }
}

main();
