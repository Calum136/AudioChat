const express = require('express');
const http = require('http');
const { InMemoryStore } = require('./store');
const { createRealtimeServer } = require('./realtime');
const { issueToken, verifyToken } = require('./auth');

const PORT = Number(process.env.PORT || 3000);
const RETENTION_SWEEP_MS = Number(process.env.RETENTION_SWEEP_MS || 60 * 60 * 1000);
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const verified = verifyToken(token, { secret: AUTH_SECRET });
  if (!verified.valid) {
    res.status(401).json({ error: 'unauthorized', reason: verified.reason });
    return;
  }
  req.userId = verified.userId;
  next();
}

function createApp({ store, realtime }) {
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

    const token = issueToken({ userId, secret: AUTH_SECRET });
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
      realtime.broadcast({ event: 'message.created', data: message });
      res.status(201).json(message);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  });

  app.get('/api/messages', authMiddleware, (req, res) => {
    const { serverId, channelId } = req.query;
    if (!serverId || !channelId) {
      res.status(400).json({ error: 'serverId and channelId are required' });
      return;
    }

    try {
      const items = store.getMessages({ serverId, channelId, userId: req.userId });
      res.json({ items });
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
  const realtime = createRealtimeServer(httpServer, store);
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
