const { WebSocketServer } = require('ws');

function createRealtimeServer(httpServer, store) {
  const wss = new WebSocketServer({ server: httpServer, path: '/realtime' });

  function broadcast(payload) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(serialized);
      }
    }
  }

  wss.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        event: 'realtime.connected',
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
        if (data.event === 'voice.join') {
          broadcast(store.joinVoice(data));
          return;
        }

        if (data.event === 'voice.leave') {
          broadcast(store.leaveVoice(data));
          return;
        }

        socket.send(JSON.stringify({ event: 'error', message: `Unsupported event: ${data.event}` }));
      } catch (error) {
        socket.send(JSON.stringify({ event: 'error', message: error.message }));
      }
    });
  });

  return { broadcast };
}

module.exports = {
  createRealtimeServer,
};
