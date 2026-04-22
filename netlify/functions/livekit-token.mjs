import { AccessToken } from 'livekit-server-sdk';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Validate a Supabase access token by calling the GoTrue /user endpoint.
// Returns { userId, error }. Keeps the function dependency-free (no sdk).
async function verifySupabaseUser(accessToken, supabaseUrl, anonKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) return { error: 'invalid_token' };
  const data = await res.json();
  if (!data?.id) return { error: 'invalid_token' };
  return { userId: data.id };
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) return json({ error: 'Missing auth token' }, 401);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json({ error: 'Supabase server env not configured' }, 500);
  }

  const { userId, error: authErr } = await verifySupabaseUser(accessToken, supabaseUrl, anonKey);
  if (authErr) return json({ error: 'Unauthorized' }, 401);

  const { roomName } = await req.json();
  if (!roomName) return json({ error: 'roomName is required' }, 400);

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return json({ error: 'LiveKit credentials not configured' }, 500);

  // Identity is derived server-side from the verified access token so a
  // malicious client can't mint tokens for other users.
  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    ttl: '6h',
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  return json({ token });
};

export const config = {
  path: '/api/livekit-token',
};
