export async function POST(request: Request) {
  try {
    // In a token-based system, logout is mainly client-side (clearing tokens)
    // But we can add server-side logic later like blacklisting tokens if needed

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Logout failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
