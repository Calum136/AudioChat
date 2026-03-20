import { AccessToken } from 'livekit-server-sdk';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { roomName, identity } = await req.json();

  if (!roomName || !identity) {
    return new Response(JSON.stringify({ error: 'roomName and identity are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: 'LiveKit credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: '6h',
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/api/livekit-token',
};
