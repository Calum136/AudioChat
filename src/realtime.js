const { WebSocketServer } = require('ws');
const { parseQuery } = require('./realtime-query');

function createRealtimeServer(httpServer, store, { verifyToken, authSecret }) {
  const wss = new WebSocketServer({ server: httpServer, path: '/realtime' });
  const sessions = new Map(); // socket => { userId, subscriptions:Set<string> }

  function broadcastToServer(serverId, payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState !== 1) continue;
      const session = sessions.get(client);
      if (!session) continue;
      if (session.subscriptions.has(serverId)) {
        client.send(serialized);
      }
    }
  }

  function send(socket, payload) {
    socket.send(JSON.stringify(payload));
  }

  wss.on('connection', (socket, req) => {
    const { token } = parseQuery(req.url);
    const verified = verifyToken(token, { secret: authSecret });

    if (!verified.valid) {
      send(socket, { event: 'error', message: 'Unauthorized websocket', reason: verified.reason });
      socket.close(1008, 'unauthorized');
      return;
    }

    sessions.set(socket, {
      userId: verified.userId,
      subscriptions: new Set(),
    });

    send(socket, {
      event: 'realtime.connected',
      userId: verified.userId,
      message: 'Connected to AudioChat realtime gateway',
    });

    socket.on('message', (rawBuffer) => {
      let data;
      try {
        data = JSON.parse(rawBuffer.toString());
      } catch {
        send(socket, { event: 'error', message: 'Payload must be valid JSON' });
        return;
      }

      const session = sessions.get(socket);
      if (!session) {
        send(socket, { event: 'error', message: 'Missing websocket session' });
        return;
      }

      try {
        if (data.event === 'subscribe.server') {
          store.assertServerMembership({ serverId: data.serverId, userId: session.userId });
          session.subscriptions.add(data.serverId);
          send(socket, { event: 'subscribed.server', serverId: data.serverId });
          return;
        }

        if (data.event === 'unsubscribe.server') {
          session.subscriptions.delete(data.serverId);
          send(socket, { event: 'unsubscribed.server', serverId: data.serverId });
          return;
        }

        if (data.event === 'presence.heartbeat') {
          const heartbeat = store.heartbeat({ serverId: data.serverId, userId: session.userId });
          broadcastToServer(data.serverId, { event: 'presence.updated', data: heartbeat });
          return;
        }

        if (data.event === 'voice.join') {
          const joined = store.joinVoice({
            serverId: data.serverId,
            channelId: data.channelId,
            userId: session.userId,
          });
          broadcastToServer(data.serverId, joined);
          return;
        }

        if (data.event === 'voice.leave') {
          const left = store.leaveVoice({
            serverId: data.serverId,
            channelId: data.channelId,
            userId: session.userId,
          });
          broadcastToServer(data.serverId, left);
          return;
        }

        send(socket, { event: 'error', message: `Unsupported event: ${data.event}` });
      } catch (error) {
        send(socket, { event: 'error', message: error.message });
      }
    });

    socket.on('close', () => {
      sessions.delete(socket);
    });
  });

  return {
    broadcastToServer,
  };
}

module.exports = {
  createRealtimeServer,
};
