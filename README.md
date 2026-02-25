# AudioChat

AudioChat is a Discord-like social app focused on voice-first hangouts for friend groups.

This backend now includes a practical vertical slice with:
- users, servers, channels, and memberships
- role-based permissions (`owner`, `admin`, `member`)
- token-based auth for HTTP + WebSocket
- realtime text fan-out, voice events, and presence updates
- 30-day retention cleanup for chat history

## Quick Start

```bash
npm install
npm start
```

Server defaults to `http://localhost:3000`.

## Seeded Dev Data

On boot, the server seeds:
- users: `u1` (Alice, owner), `u2` (Bob, member)
- server: `s1`
- channels: `c-text-1` (text), `c-voice-1` (voice)

Get a token:

```bash
curl -s -X POST http://localhost:3000/api/auth/dev-login \
  -H 'content-type: application/json' \
  -d '{"userId":"u1"}'
```

Use returned token as `Authorization: Bearer <token>`.

## HTTP API (Bootstrap)

### Public
- `GET /health`
- `POST /api/users`
- `POST /api/auth/dev-login`

### Authenticated
- `POST /api/servers`
- `POST /api/members`
- `POST /api/channels`
- `POST /api/messages`
- `GET /api/messages?serverId=s1&channelId=c-text-1`
- `POST /api/presence/heartbeat`
- `GET /api/presence?serverId=s1`

## Realtime WebSocket

Connect with token query parameter:

`ws://localhost:3000/realtime?token=<TOKEN>`

After connect, subscribe to a server:
- `subscribe.server` with `{ "serverId":"s1" }`

Optional unsubscribe:
- `unsubscribe.server` with `{ "serverId":"s1" }`

Other inbound events:
- `presence.heartbeat` with `{ "serverId":"s1" }`
- `voice.join` with `{ "serverId":"s1", "channelId":"c-voice-1" }`
- `voice.leave` with `{ "serverId":"s1", "channelId":"c-voice-1" }`

Outbound events:
- `subscribed.server`
- `presence.updated`
- `voice.joined` + `soundCue: "join"`
- `voice.left` + `soundCue: "leave"`
- `message.created`

## Retention Behavior

Messages older than 30 days are removed by a scheduled sweep.
- Default sweep interval: every hour
- Override with `RETENTION_SWEEP_MS`

## Scripts

```bash
npm test
```

Tests currently cover:
- token issue/verify and expiry behavior
- permission boundaries (member vs owner actions)
- query parsing for websocket auth token
- 30-day retention cleanup logic
- presence heartbeat online/offline status
- voice join/leave cue payloads

## Next Major Steps

1. Persist entities to PostgreSQL and cache presence in Redis.
2. Add scoped channel subscriptions (text/voice channel level).
3. Integrate SFU media service (e.g. LiveKit/mediasoup) for real voice transport.
4. Add moderation actions, typing indicators, and presence heartbeats over intervals.
5. Add streaming sessions and adaptive quality controls toward 1080p60.
