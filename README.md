# AudioChat

AudioChat is a Discord-like social app focused on voice-first hangouts for friend groups.

This backend includes:
- users, servers, channels, and memberships
- role-based permissions (`owner`, `admin`, `member`)
- token-based auth for API and WebSocket access
- realtime text message fan-out with channel-scoped delivery
- voice join/leave events with `soundCue` metadata
- typing indicators with auto-timeout
- user presence heartbeats (online/idle/offline)
- moderation: voice mute/kick, server ban/unban
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

## HTTP API

### Public
- `GET /health`
- `POST /api/users` — create user
- `POST /api/auth/dev-login` — get auth token

### Servers (Authenticated)
- `GET /api/servers` — list user's servers
- `GET /api/servers/:id` — get server details
- `POST /api/servers` — create server

### Channels (Authenticated)
- `GET /api/channels?serverId=` — list channels in a server
- `POST /api/channels` — create channel
- `DELETE /api/channels/:id` — delete channel (owner/admin)

### Members (Authenticated)
- `GET /api/members?serverId=` — list members with roles
- `POST /api/members` — add member to server
- `PUT /api/members` — change member role (promote/demote)
- `DELETE /api/members` — kick member from server

### Messages (Authenticated)
- `GET /api/messages?serverId=&channelId=&limit=&before=` — paginated messages
- `POST /api/messages` — send message
- `PUT /api/messages/:id` — edit message (author only)
- `DELETE /api/messages/:id` — delete message (author or message.delete perm)

### Voice (Authenticated)
- `GET /api/voice-presence?serverId=&channelId=` — who's in voice

### Moderation (Authenticated)
- `POST /api/moderation/voice-mute` — mute user in voice channel
- `POST /api/moderation/voice-unmute` — unmute user
- `POST /api/moderation/voice-kick` — kick user from voice channel
- `POST /api/moderation/ban` — ban user from server
- `POST /api/moderation/unban` — unban user

## Realtime WebSocket

Connect to: `ws://localhost:3000/realtime?token=<token>`

WebSocket connections require a valid auth token passed as a query parameter. Unauthenticated connections are rejected with 401.

### Inbound Events (client → server)

| Event | Payload | Description |
|-------|---------|-------------|
| `channel.subscribe` | `{ channelId }` | Subscribe to channel events |
| `channel.unsubscribe` | `{ channelId }` | Unsubscribe from channel |
| `voice.join` | `{ serverId, channelId }` | Join voice channel |
| `voice.leave` | `{ serverId, channelId }` | Leave voice channel |
| `typing.start` | `{ channelId }` | Start typing indicator |
| `typing.stop` | `{ channelId }` | Stop typing indicator |
| `heartbeat` | `{}` | Presence heartbeat |

### Outbound Events (server → client)

| Event | Delivery | Description |
|-------|----------|-------------|
| `realtime.connected` | sender | Connection confirmed |
| `channel.subscribed` | sender | Subscription confirmed |
| `voice.joined` | server members | User joined voice |
| `voice.left` | server members | User left voice |
| `voice.muted` | server members | User muted in voice |
| `voice.unmuted` | server members | User unmuted |
| `voice.kicked` | server members | User kicked from voice |
| `message.created` | channel subscribers | New message |
| `message.updated` | channel subscribers | Message edited |
| `message.deleted` | channel subscribers | Message deleted |
| `typing.start` | channel subscribers (excl. sender) | User started typing |
| `typing.stop` | channel subscribers (excl. sender) | User stopped typing |
| `presence.update` | server members | User online/idle/offline |
| `member.updated` | server members | Role changed |
| `member.removed` | server members | Member kicked |
| `member.banned` | server members | Member banned |

### Scoped Delivery

Events are scoped — clients only receive events for servers they belong to and channels they've subscribed to. No cross-server or cross-channel leakage.

## Retention Behavior

Messages older than 30 days are removed by a scheduled sweep.
- Default sweep interval: every hour
- Override with `RETENTION_SWEEP_MS`

## Scripts

```bash
npm test
```

Tests cover (87 total):
- Token issue/verify, expiry, edge cases (9 tests)
- Store CRUD, permissions, pagination, moderation (34 tests)
- REST API integration: all endpoints, auth, error cases (27 tests)
- WebSocket: auth, scoped delivery, typing, voice, disconnect cleanup (13 tests)

## Next Major Steps

1. Persist entities to PostgreSQL and cache presence in Redis.
2. Integrate SFU media service (e.g. LiveKit/mediasoup) for real voice transport.
3. Add streaming sessions and adaptive quality controls toward 1080p60.
