const test = require('node:test');
const assert = require('node:assert/strict');
const { WebSocket } = require('ws');
const { createTestEnv, seedTestData, waitForMessage, waitForOpen } = require('./helpers');

test('WebSocket integration', async (t) => {
  let env;
  const sockets = [];

  function trackWs(ws) {
    sockets.push(ws);
    return ws;
  }

  t.before(async () => {
    env = await createTestEnv();
    seedTestData(env.store);
  });

  t.afterEach(() => {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
    sockets.length = 0;
  });

  t.after(async () => { await env.cleanup(); });

  await t.test('unauthenticated WS connection is rejected', async () => {
    const ws = trackWs(new WebSocket(`${env.wsUrl}`));
    await new Promise((resolve) => {
      ws.on('unexpected-response', (_req, res) => {
        assert.equal(res.statusCode, 401);
        resolve();
      });
      ws.on('error', () => resolve());
    });
  });

  await t.test('invalid token WS connection is rejected', async () => {
    const ws = trackWs(new WebSocket(`${env.wsUrl}?token=bad.token`));
    await new Promise((resolve) => {
      ws.on('unexpected-response', (_req, res) => {
        assert.equal(res.statusCode, 401);
        resolve();
      });
      ws.on('error', () => resolve());
    });
  });

  await t.test('authenticated WS gets connected event with userId', async () => {
    const ws = trackWs(env.ws('u1'));
    const msg = await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    assert.equal(msg.userId, 'u1');
  });

  await t.test('channel.subscribe succeeds for server member', async () => {
    const ws = trackWs(env.ws('u1'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    ws.send(JSON.stringify({ event: 'channel.subscribe', channelId: 't1' }));
    const msg = await waitForMessage(ws, (d) => d.event === 'channel.subscribed');
    assert.equal(msg.channelId, 't1');
  });

  await t.test('channel.subscribe fails for non-member', async () => {
    env.store.createUser({ id: 'u4', name: 'Dave' });
    const ws = trackWs(env.ws('u4'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    ws.send(JSON.stringify({ event: 'channel.subscribe', channelId: 't1' }));
    const msg = await waitForMessage(ws, (d) => d.event === 'error');
    assert.match(msg.message, /not a member/);
  });

  await t.test('voice.join uses authenticated userId, not client-sent', async () => {
    const ws = trackWs(env.ws('u2'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    // Try to impersonate u1
    ws.send(JSON.stringify({
      event: 'voice.join',
      serverId: 's1',
      channelId: 'v1',
      userId: 'u1', // impersonation attempt
    }));
    const joined = await waitForMessage(ws, (d) => d.event === 'voice.joined');
    assert.equal(joined.userId, 'u2'); // should be the authenticated user
    // Cleanup
    env.store.voicePresence.delete('v1:u2');
  });

  await t.test('voice.leave broadcasts to server members', async () => {
    const ws1 = trackWs(env.ws('u1'));
    const ws2 = trackWs(env.ws('u2'));
    await waitForMessage(ws1, (d) => d.event === 'realtime.connected');
    await waitForMessage(ws2, (d) => d.event === 'realtime.connected');

    // u2 joins voice
    ws2.send(JSON.stringify({ event: 'voice.join', serverId: 's1', channelId: 'v1' }));
    await waitForMessage(ws1, (d) => d.event === 'voice.joined');

    // u2 leaves voice
    ws2.send(JSON.stringify({ event: 'voice.leave', serverId: 's1', channelId: 'v1' }));
    const left = await waitForMessage(ws1, (d) => d.event === 'voice.left');
    assert.equal(left.userId, 'u2');
    assert.equal(left.soundCue, 'leave');
  });

  await t.test('scoped delivery: non-member does not receive server events', async () => {
    env.store.createUser({ id: 'u5', name: 'Eve' });
    const ws1 = trackWs(env.ws('u1'));
    const ws5 = trackWs(env.ws('u5'));
    await waitForMessage(ws1, (d) => d.event === 'realtime.connected');
    await waitForMessage(ws5, (d) => d.event === 'realtime.connected');

    // u1 joins voice in s1
    ws1.send(JSON.stringify({ event: 'voice.join', serverId: 's1', channelId: 'v1' }));

    // u1 should receive the voice.joined event (they're a member of s1)
    const joined = await waitForMessage(ws1, (d) => d.event === 'voice.joined');
    assert.equal(joined.userId, 'u1');

    // Give u5 a moment — they should NOT receive anything
    let u5Received = false;
    ws5.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.event === 'voice.joined') u5Received = true;
    });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(u5Received, false);

    // Cleanup
    env.store.voicePresence.delete('v1:u1');
  });

  await t.test('typing indicator flow', async () => {
    const ws1 = trackWs(env.ws('u1'));
    const ws2 = trackWs(env.ws('u2'));
    await waitForMessage(ws1, (d) => d.event === 'realtime.connected');
    await waitForMessage(ws2, (d) => d.event === 'realtime.connected');

    // Both subscribe to text channel
    ws1.send(JSON.stringify({ event: 'channel.subscribe', channelId: 't1' }));
    ws2.send(JSON.stringify({ event: 'channel.subscribe', channelId: 't1' }));
    await waitForMessage(ws1, (d) => d.event === 'channel.subscribed');
    await waitForMessage(ws2, (d) => d.event === 'channel.subscribed');

    // u1 starts typing
    ws1.send(JSON.stringify({ event: 'typing.start', channelId: 't1' }));
    const typing = await waitForMessage(ws2, (d) => d.event === 'typing.start');
    assert.equal(typing.userId, 'u1');
    assert.equal(typing.channelId, 't1');

    // u1 stops typing
    ws1.send(JSON.stringify({ event: 'typing.stop', channelId: 't1' }));
    const stopped = await waitForMessage(ws2, (d) => d.event === 'typing.stop');
    assert.equal(stopped.userId, 'u1');
  });

  await t.test('typing sender does not receive their own indicator', async () => {
    const ws1 = trackWs(env.ws('u1'));
    await waitForMessage(ws1, (d) => d.event === 'realtime.connected');
    ws1.send(JSON.stringify({ event: 'channel.subscribe', channelId: 't1' }));
    await waitForMessage(ws1, (d) => d.event === 'channel.subscribed');

    ws1.send(JSON.stringify({ event: 'typing.start', channelId: 't1' }));

    let selfReceived = false;
    ws1.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.event === 'typing.start') selfReceived = true;
    });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(selfReceived, false);
  });

  await t.test('disconnect cleans up voice presence', async () => {
    const ws = trackWs(env.ws('u2'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');

    ws.send(JSON.stringify({ event: 'voice.join', serverId: 's1', channelId: 'v1' }));
    await waitForMessage(ws, (d) => d.event === 'voice.joined');
    assert.equal(env.store.voicePresence.size, 1);

    ws.close();
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(env.store.voicePresence.size, 0);
  });

  await t.test('malformed JSON returns error', async () => {
    const ws = trackWs(env.ws('u1'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    ws.send('not json!!!');
    const err = await waitForMessage(ws, (d) => d.event === 'error');
    assert.match(err.message, /valid JSON/);
  });

  await t.test('unsupported event returns error', async () => {
    const ws = trackWs(env.ws('u1'));
    await waitForMessage(ws, (d) => d.event === 'realtime.connected');
    ws.send(JSON.stringify({ event: 'unknown.event' }));
    const err = await waitForMessage(ws, (d) => d.event === 'error');
    assert.match(err.message, /Unsupported event/);
  });
});
