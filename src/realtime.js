const { WebSocketServer } = require('ws');
const { verifyToken } = require('./auth');

function createRealtimeServer(httpServer, store, { authSecret }) {
  const wss = new WebSocketServer({ noServer: true });

  // --- Scoped broadcast helpers ---

  function broadcastToServer(serverId, payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1 && client.serverMemberships.has(serverId)) {
        client.send(serialized);
      }
    }
  }

  function broadcastToChannel(channelId, payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1 && client.subscribedChannels.has(channelId)) {
        client.send(serialized);
      }
    }
  }

  function broadcastToChannelExcept(channelId, excludeUserId, payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (
        client.readyState === 1 &&
        client.subscribedChannels.has(channelId) &&
        client.userId !== excludeUserId
      ) {
        client.send(serialized);
      }
    }
  }

  function sendToUser(userId, payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1 && client.userId === userId) {
        client.send(serialized);
      }
    }
  }

  function refreshUserMemberships(userId) {
    for (const client of wss.clients) {
      if (client.readyState === 1 && client.userId === userId) {
        client.serverMemberships.clear();
        for (const [key] of store.memberships) {
          const [sId, uId] = key.split(':');
          if (uId === userId) client.serverMemberships.add(sId);
        }
      }
    }
  }

  // --- HTTP upgrade handler (auth gate) ---

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/realtime') {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get('token');
    const verified = verifyToken(token, { secret: authSecret });
    if (!verified.valid) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = verified.userId;
      wss.emit('connection', ws, request);
    });
  });

  // --- Connection handler ---

  wss.on('connection', (socket) => {
    socket.subscribedChannels = new Set();
    socket.serverMemberships = new Set();
    socket.typingTimers = new Map();
    socket.connectedAt = Date.now();
    socket.lastHeartbeat = Date.now();

    // Populate server memberships from store
    for (const [key] of store.memberships) {
      const [serverId, userId] = key.split(':');
      if (userId === socket.userId) {
        socket.serverMemberships.add(serverId);
      }
    }

    socket.send(
      JSON.stringify({
        event: 'realtime.connected',
        userId: socket.userId,
        message: 'Connected to AudioChat realtime gateway',
      }),
    );

    socket.on('message', (rawBuffer) => {
      let data;
      try {
        data = JSON.parse(rawBuffer.toString());
      } catch {
        socket.send(JSON.stringify({ event: 'error', message: 'Payload must be valid JSON' }));
        return;
      }

      try {
        handleEvent(socket, data);
      } catch (error) {
        socket.send(JSON.stringify({ event: 'error', message: error.message }));
      }
    });

    socket.on('close', () => {
      // Clear typing timers
      for (const [, timer] of socket.typingTimers) {
        clearTimeout(timer);
      }

      // Remove from voice channels and broadcast leave
      for (const [key, presence] of store.voicePresence) {
        if (presence.userId === socket.userId) {
          store.voicePresence.delete(key);
          broadcastToServer(presence.serverId, {
            event: 'voice.left',
            serverId: presence.serverId,
            channelId: presence.channelId,
            userId: socket.userId,
            soundCue: 'leave',
          });
        }
      }
    });
  });

  // --- Event router ---

  function handleEvent(socket, data) {
    switch (data.event) {
      case 'channel.subscribe': {
        const channel = store.channels.get(data.channelId);
        if (!channel) {
          socket.send(JSON.stringify({ event: 'error', message: 'channel not found' }));
          return;
        }
        if (!socket.serverMemberships.has(channel.serverId)) {
          socket.send(JSON.stringify({ event: 'error', message: 'not a member of this server' }));
          return;
        }
        socket.subscribedChannels.add(data.channelId);
        socket.send(JSON.stringify({ event: 'channel.subscribed', channelId: data.channelId }));
        return;
      }

      case 'channel.unsubscribe': {
        socket.subscribedChannels.delete(data.channelId);
        socket.send(JSON.stringify({ event: 'channel.unsubscribed', channelId: data.channelId }));
        return;
      }

      case 'voice.join': {
        const result = store.joinVoice({
          serverId: data.serverId,
          channelId: data.channelId,
          userId: socket.userId, // use authenticated identity
        });
        broadcastToServer(data.serverId, result);
        return;
      }

      case 'voice.leave': {
        const result = store.leaveVoice({
          serverId: data.serverId,
          channelId: data.channelId,
          userId: socket.userId, // use authenticated identity
        });
        broadcastToServer(data.serverId, result);
        return;
      }

      case 'typing.start': {
        const channel = store.channels.get(data.channelId);
        if (!channel || !socket.serverMemberships.has(channel.serverId)) {
          socket.send(JSON.stringify({ event: 'error', message: 'invalid channel' }));
          return;
        }

        // Clear existing auto-stop timer
        if (socket.typingTimers.has(data.channelId)) {
          clearTimeout(socket.typingTimers.get(data.channelId));
        }

        broadcastToChannelExcept(data.channelId, socket.userId, {
          event: 'typing.start',
          channelId: data.channelId,
          userId: socket.userId,
        });

        // Auto-stop after 5 seconds
        const timer = setTimeout(() => {
          socket.typingTimers.delete(data.channelId);
          broadcastToChannelExcept(data.channelId, socket.userId, {
            event: 'typing.stop',
            channelId: data.channelId,
            userId: socket.userId,
          });
        }, 5000);
        socket.typingTimers.set(data.channelId, timer);
        return;
      }

      case 'typing.stop': {
        if (socket.typingTimers.has(data.channelId)) {
          clearTimeout(socket.typingTimers.get(data.channelId));
          socket.typingTimers.delete(data.channelId);
        }
        broadcastToChannelExcept(data.channelId, socket.userId, {
          event: 'typing.stop',
          channelId: data.channelId,
          userId: socket.userId,
        });
        return;
      }

      case 'heartbeat': {
        socket.lastHeartbeat = Date.now();
        if (store.userPresence) {
          store.updatePresence(socket.userId, 'online');
        }
        return;
      }

      default:
        socket.send(JSON.stringify({ event: 'error', message: `Unsupported event: ${data.event}` }));
    }
  }

  // --- Presence heartbeat checker ---

  const HEARTBEAT_INTERVAL = 30000;
  const IDLE_THRESHOLD = 60000;
  const OFFLINE_THRESHOLD = 120000;

  const heartbeatChecker = setInterval(() => {
    if (!store.userPresence) return;
    const now = Date.now();
    for (const client of wss.clients) {
      if (client.readyState !== 1) continue;
      const elapsed = now - (client.lastHeartbeat || client.connectedAt || 0);
      let newStatus;
      if (elapsed > OFFLINE_THRESHOLD) {
        newStatus = 'offline';
      } else if (elapsed > IDLE_THRESHOLD) {
        newStatus = 'idle';
      } else {
        continue;
      }
      const current = store.getPresence(client.userId);
      if (current.status !== newStatus) {
        store.updatePresence(client.userId, newStatus);
        for (const serverId of client.serverMemberships) {
          broadcastToServer(serverId, {
            event: 'presence.update',
            userId: client.userId,
            status: newStatus,
          });
        }
      }
    }
  }, HEARTBEAT_INTERVAL);

  return {
    broadcastToServer,
    broadcastToChannel,
    broadcastToChannelExcept,
    sendToUser,
    refreshUserMemberships,
    cleanup: () => clearInterval(heartbeatChecker),
  };
}

module.exports = {
  createRealtimeServer,
};
