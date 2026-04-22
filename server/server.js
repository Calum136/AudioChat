// Minimal dev token server for Sidequest.
//
// Only exists so `npm run dev` and `npm run electron:dev` can mint LiveKit
// tokens without hitting the Netlify function. Production uses
// netlify/functions/livekit-token.mjs. All legacy AudioChat endpoints
// (users, servers, channels, moderation) moved to Supabase long ago and
// were removed.

const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const PORT = Number(process.env.PORT || 3000);
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function verifySupabaseUser(accessToken) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { error: 'supabase_not_configured' };
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return { error: 'invalid_token' };
  const data = await res.json();
  if (!data?.id) return { error: 'invalid_token' };
  return { userId: data.id };
}

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'sidequest-dev' }));

  app.post('/api/livekit-token', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Missing auth token' });

    const { userId, error: authErr } = await verifySupabaseUser(accessToken);
    if (authErr) {
      const status = authErr === 'supabase_not_configured' ? 500 : 401;
      return res.status(status).json({ error: authErr });
    }

    const { roomName } = req.body || {};
    if (!roomName) return res.status(400).json({ error: 'roomName is required' });

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'LiveKit credentials not configured' });
    }

    // Identity is derived from the verified Supabase user so clients can't
    // masquerade as another user.
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      ttl: '6h',
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    res.json({ token });
  });

  return app;
}

function startServer() {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`Sidequest dev token server listening on http://localhost:${PORT}`);
  });
  return { app, server, stop: () => new Promise((r, j) => server.close((e) => (e ? j(e) : r()))) };
}

if (require.main === module) startServer();

module.exports = { createApp, startServer };
