const http = require('http');
const { InMemoryStore } = require('../src/store');
const { createRealtimeServer } = require('../src/realtime');
const { createApp } = require('../src/server');
const { issueToken } = require('../src/auth');
const { WebSocket } = require('ws');

const AUTH_SECRET = 'test-secret';

function createTestEnv() {
  const store = new InMemoryStore();
  const httpServer = http.createServer();
  const realtime = createRealtimeServer(httpServer, store, { authSecret: AUTH_SECRET });
  const app = createApp({ store, realtime, authSecret: AUTH_SECRET });
  httpServer.on('request', app);

  return new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      const baseUrl = `http://localhost:${port}`;
      const wsUrl = `ws://localhost:${port}/realtime`;

      resolve({
        store,
        realtime,
        httpServer,
        port,
        baseUrl,
        wsUrl,
        token: (userId) => issueToken({ userId, secret: AUTH_SECRET }),
        request: (path, opts = {}) => {
          return fetch(`${baseUrl}${path}`, opts);
        },
        ws: (userId) => {
          const tok = issueToken({ userId, secret: AUTH_SECRET });
          return new WebSocket(`${wsUrl}?token=${tok}`);
        },
        cleanup: async () => {
          realtime.cleanup();
          return new Promise((res, rej) => httpServer.close((e) => (e ? rej(e) : res())));
        },
      });
    });
  });
}

function seedTestData(store) {
  store.createUser({ id: 'u1', name: 'Alice' });
  store.createUser({ id: 'u2', name: 'Bob' });
  store.createServer({ id: 's1', name: 'Friends', ownerId: 'u1' });
  store.addMember({ serverId: 's1', userId: 'u2', role: 'member', actorUserId: 'u1' });
  store.createChannel({ id: 't1', serverId: 's1', name: 'general', type: 'text', actorUserId: 'u1' });
  store.createChannel({ id: 'v1', serverId: 's1', name: 'lounge', type: 'voice', actorUserId: 'u1' });
}

function waitForMessage(ws, filter, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for WS message')), timeout);
    function handler(raw) {
      const data = JSON.parse(raw.toString());
      if (!filter || filter(data)) {
        clearTimeout(timer);
        ws.removeListener('message', handler);
        resolve(data);
      }
    }
    ws.on('message', handler);
  });
}

function waitForOpen(ws) {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();
    ws.on('open', resolve);
    ws.on('error', reject);
  });
}

module.exports = { createTestEnv, seedTestData, waitForMessage, waitForOpen, AUTH_SECRET };
