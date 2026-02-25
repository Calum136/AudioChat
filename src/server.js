const express = require('express');
const http = require('http');
const { InMemoryStore } = require('./store');
const { createRealtimeServer } = require('./realtime');
const { issueToken, verifyToken } = require('./auth');

const PORT = Number(process.env.PORT || 3000);
const RETENTION_SWEEP_MS = Number(process.env.RETENTION_SWEEP_MS || 60 * 60 * 1000);
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

function createAuthMiddleware(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    const verified = verifyToken(token, { secret });
    if (!verified.valid) {
      res.status(401).json({ error: 'unauthorized', reason: verified.reason });
      return;
    }
    req.userId = verified.userId;
    next();
  };
}

function createApp({ store, realtime, authSecret = AUTH_SECRET }) {
  const authMiddleware = createAuthMiddleware(authSecret);
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'audiochat-backend' });
  });

  app.post('/api/auth/dev-login', (req, res) => {
    const { userId } = req.body;
    if (!userId || !store.users.has(userId)) {
      res.status(400).json({ error: 'valid userId is required' });
      return;
    }

    const token = issueToken({ userId, secret: authSecret });
    res.json({ token, userId });
  });

  app.post('/api/users', (req, res) => {
    try {
      const user = store.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/servers', authMiddleware, (req, res) => {
    try {
      const server = store.createServer({ ...req.body, ownerId: req.userId });
      res.status(201).json(server);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/members', authMiddleware, (req, res) => {
    try {
      const membership = store.addMember({ ...req.body, actorUserId: req.userId });
      res.status(201).json(membership);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/channels', authMiddleware, (req, res) => {
    try {
      const channel = store.createChannel({ ...req.body, actorUserId: req.userId });
      res.status(201).json(channel);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/messages', authMiddleware, (req, res) => {
    try {
      const message = store.addMessage({ ...req.body, userId: req.userId });
      realtime.broadcastToChannel(message.channelId, { event: 'message.created', data: message });
      res.status(201).json(message);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  // --- Read endpoints ---

  app.get('/api/servers', authMiddleware, (req, res) => {
    const servers = store.getServersForUser(req.userId);
    res.json({ items: servers });
  });

  app.get('/api/servers/:id', authMiddleware, (req, res) => {
    try {
      const server = store.getServer(req.params.id);
      const role = store.getRole({ serverId: req.params.id, userId: req.userId });
      if (!role) return res.status(403).json({ error: 'not a server member' });
      res.json(server);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  app.get('/api/channels', authMiddleware, (req, res) => {
    const { serverId } = req.query;
    if (!serverId) return res.status(400).json({ error: 'serverId is required' });
    try {
      const channels = store.getChannels({ serverId, userId: req.userId });
      res.json({ items: channels });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.get('/api/members', authMiddleware, (req, res) => {
    const { serverId } = req.query;
    if (!serverId) return res.status(400).json({ error: 'serverId is required' });
    try {
      const members = store.getMembers({ serverId, userId: req.userId });
      res.json({ items: members });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.get('/api/voice-presence', authMiddleware, (req, res) => {
    const { serverId, channelId } = req.query;
    if (!serverId) return res.status(400).json({ error: 'serverId is required' });
    try {
      const presence = store.getVoicePresence({ serverId, channelId, userId: req.userId });
      res.json({ items: presence });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.get('/api/messages', authMiddleware, (req, res) => {
    const { serverId, channelId, limit, before } = req.query;
    if (!serverId || !channelId) {
      res.status(400).json({ error: 'serverId and channelId are required' });
      return;
    }
    try {
      const items = store.getMessages({
        serverId, channelId, userId: req.userId,
        limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
        before,
      });
      res.json({ items });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  // --- Update endpoints ---

  app.put('/api/members', authMiddleware, (req, res) => {
    const { serverId, userId, role } = req.body;
    if (!serverId || !userId || !role) {
      return res.status(400).json({ error: 'serverId, userId, and role are required' });
    }
    try {
      const result = store.updateMemberRole({ serverId, targetUserId: userId, role, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, { event: 'member.updated', data: result });
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.put('/api/messages/:id', authMiddleware, (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    try {
      const msg = store.editMessage({ messageId: req.params.id, content, actorUserId: req.userId });
      realtime.broadcastToChannel(msg.channelId, { event: 'message.updated', data: msg });
      res.json(msg);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  // --- Delete endpoints ---

  app.delete('/api/channels/:id', authMiddleware, (req, res) => {
    try {
      const result = store.deleteChannel({ channelId: req.params.id, actorUserId: req.userId });
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.delete('/api/messages/:id', authMiddleware, (req, res) => {
    try {
      const msg = store.deleteMessage({ messageId: req.params.id, actorUserId: req.userId });
      realtime.broadcastToChannel(msg.channelId, { event: 'message.deleted', data: { id: msg.id, channelId: msg.channelId } });
      res.json({ deleted: msg.id });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.delete('/api/members', authMiddleware, (req, res) => {
    const { serverId, userId } = req.body;
    if (!serverId || !userId) return res.status(400).json({ error: 'serverId and userId are required' });
    try {
      const result = store.removeMember({ serverId, targetUserId: userId, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, { event: 'member.removed', data: result });
      realtime.refreshUserMemberships(userId);
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  // --- Moderation endpoints ---

  app.post('/api/moderation/voice-mute', authMiddleware, (req, res) => {
    const { serverId, channelId, userId } = req.body;
    try {
      const result = store.muteInVoice({ serverId, channelId, targetUserId: userId, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, result);
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/moderation/voice-unmute', authMiddleware, (req, res) => {
    const { serverId, channelId, userId } = req.body;
    try {
      const result = store.unmuteInVoice({ serverId, channelId, targetUserId: userId, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, result);
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/moderation/voice-kick', authMiddleware, (req, res) => {
    const { serverId, channelId, userId } = req.body;
    try {
      const result = store.kickFromVoice({ serverId, channelId, targetUserId: userId, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, result);
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/moderation/ban', authMiddleware, (req, res) => {
    const { serverId, userId, reason } = req.body;
    try {
      const result = store.banFromServer({ serverId, targetUserId: userId, reason, actorUserId: req.userId });
      realtime.broadcastToServer(serverId, { event: 'member.banned', data: result });
      realtime.refreshUserMemberships(userId);
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.post('/api/moderation/unban', authMiddleware, (req, res) => {
    const { serverId, userId } = req.body;
    try {
      const result = store.unbanFromServer({ serverId, targetUserId: userId, actorUserId: req.userId });
      res.json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  return app;
}

function seedDemoData(store) {
  if (store.users.size > 0) return;

  store.createUser({ id: 'u1', name: 'Alice' });
  store.createUser({ id: 'u2', name: 'Bob' });

  const server = store.createServer({ id: 's1', name: 'Friends', ownerId: 'u1' });
  store.addMember({ serverId: server.id, userId: 'u2', role: 'member', actorUserId: 'u1' });
  store.createChannel({ id: 'c-text-1', serverId: 's1', name: 'general', type: 'text', actorUserId: 'u1' });
  store.createChannel({ id: 'c-voice-1', serverId: 's1', name: 'Lounge', type: 'voice', actorUserId: 'u1' });
}

function startServer() {
  const store = new InMemoryStore();
  seedDemoData(store);

  const httpServer = http.createServer();
  const realtime = createRealtimeServer(httpServer, store, { authSecret: AUTH_SECRET });
  const app = createApp({ store, realtime });

  httpServer.on('request', app);

  const retentionTimer = setInterval(() => {
    const removed = store.purgeExpiredMessages();
    if (removed > 0) {
      console.log(`Retention sweep removed ${removed} expired messages`);
    }
  }, RETENTION_SWEEP_MS);

  httpServer.listen(PORT, () => {
    console.log(`AudioChat backend listening on http://localhost:${PORT}`);
    console.log('Seeded users: u1 (owner), u2 (member). Use /api/auth/dev-login to get token.');
  });

  return {
    app,
    httpServer,
    stop: () => {
      clearInterval(retentionTimer);
      realtime.cleanup();
      return new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
  seedDemoData,
};
