const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestEnv, seedTestData } = require('./helpers');

test('REST API integration', async (t) => {
  let env;

  t.before(async () => {
    env = await createTestEnv();
    seedTestData(env.store);
  });

  t.after(async () => { await env.cleanup(); });

  // --- Auth ---

  await t.test('unauthenticated request returns 401', async () => {
    const res = await env.request('/api/servers');
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/auth/dev-login returns token', async () => {
    const res = await env.request('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.equal(body.userId, 'u1');
  });

  await t.test('POST /api/auth/dev-login rejects invalid userId', async () => {
    const res = await env.request('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'nonexistent' }),
    });
    assert.equal(res.status, 400);
  });

  // --- Servers ---

  await t.test('GET /api/servers returns user servers', async () => {
    const res = await env.request('/api/servers', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].id, 's1');
  });

  await t.test('GET /api/servers/:id returns server details', async () => {
    const res = await env.request('/api/servers/s1', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'Friends');
  });

  await t.test('GET /api/servers/:id returns 403 for non-member', async () => {
    env.store.createUser({ id: 'u3', name: 'Charlie' });
    const res = await env.request('/api/servers/s1', {
      headers: { Authorization: `Bearer ${env.token('u3')}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('GET /api/servers/:id returns 404 for non-existent', async () => {
    const res = await env.request('/api/servers/nope', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 404);
  });

  // --- Channels ---

  await t.test('GET /api/channels lists server channels', async () => {
    const res = await env.request('/api/channels?serverId=s1', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
  });

  await t.test('GET /api/channels requires serverId', async () => {
    const res = await env.request('/api/channels', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 400);
  });

  await t.test('DELETE /api/channels/:id works for owner', async () => {
    env.store.createChannel({ id: 'temp-ch', serverId: 's1', name: 'temp', type: 'text', actorUserId: 'u1' });
    const res = await env.request('/api/channels/temp-ch', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    assert.equal(env.store.channels.has('temp-ch'), false);
  });

  await t.test('DELETE /api/channels/:id forbidden for member', async () => {
    env.store.createChannel({ id: 'keep-ch', serverId: 's1', name: 'keep', type: 'text', actorUserId: 'u1' });
    const res = await env.request('/api/channels/keep-ch', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.token('u2')}` },
    });
    assert.equal(res.status, 403);
    // Cleanup
    env.store.channels.delete('keep-ch');
  });

  // --- Members ---

  await t.test('GET /api/members lists server members', async () => {
    const res = await env.request('/api/members?serverId=s1', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.items.length >= 2);
  });

  await t.test('PUT /api/members promotes user to admin', async () => {
    const res = await env.request('/api/members', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', userId: 'u2', role: 'admin' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.role, 'admin');
    // Reset
    env.store.memberships.set('s1:u2', 'member');
  });

  await t.test('PUT /api/members rejects invalid role', async () => {
    const res = await env.request('/api/members', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', userId: 'u2', role: 'superadmin' }),
    });
    assert.equal(res.status, 403);
  });

  await t.test('PUT /api/members requires all fields', async () => {
    const res = await env.request('/api/members', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1' }),
    });
    assert.equal(res.status, 400);
  });

  // --- Messages ---

  await t.test('POST /api/messages creates a message', async () => {
    const res = await env.request('/api/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u2')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', channelId: 't1', content: 'hello' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.content, 'hello');
    assert.equal(body.userId, 'u2');
  });

  await t.test('GET /api/messages returns channel messages', async () => {
    const res = await env.request('/api/messages?serverId=s1&channelId=t1', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.items.length >= 1);
  });

  await t.test('GET /api/messages supports pagination limit', async () => {
    // Add more messages
    for (let i = 0; i < 5; i++) {
      env.store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: `paginated-${i}` });
    }
    const res = await env.request('/api/messages?serverId=s1&channelId=t1&limit=2', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
  });

  await t.test('PUT /api/messages/:id edits a message', async () => {
    const msg = env.store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'original' });
    const res = await env.request(`/api/messages/${msg.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.token('u2')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'edited' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.content, 'edited');
    assert.ok(body.editedAt);
  });

  await t.test('PUT /api/messages/:id rejects non-author', async () => {
    const msg = env.store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'theirs' });
    const res = await env.request(`/api/messages/${msg.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'hijacked' }),
    });
    assert.equal(res.status, 403);
  });

  await t.test('DELETE /api/messages/:id author can delete own', async () => {
    const msg = env.store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'deletable' });
    const res = await env.request(`/api/messages/${msg.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.token('u2')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.deleted, msg.id);
  });

  // --- Voice presence ---

  await t.test('GET /api/voice-presence returns voice state', async () => {
    env.store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
    const res = await env.request('/api/voice-presence?serverId=s1&channelId=v1', {
      headers: { Authorization: `Bearer ${env.token('u1')}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].userId, 'u2');
    // Cleanup
    env.store.leaveVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  });

  // --- Moderation ---

  await t.test('POST /api/moderation/voice-mute works for owner', async () => {
    env.store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
    const res = await env.request('/api/moderation/voice-mute', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', channelId: 'v1', userId: 'u2' }),
    });
    assert.equal(res.status, 200);
    assert.equal(env.store.isVoiceMuted('v1', 'u2'), true);
    // Cleanup
    env.store.unmuteInVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u2', actorUserId: 'u1' });
    env.store.leaveVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  });

  await t.test('POST /api/moderation/voice-mute forbidden for member', async () => {
    const res = await env.request('/api/moderation/voice-mute', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u2')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', channelId: 'v1', userId: 'u1' }),
    });
    assert.equal(res.status, 403);
  });

  await t.test('POST /api/moderation/ban prevents rejoining', async () => {
    const banRes = await env.request('/api/moderation/ban', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', userId: 'u2', reason: 'testing' }),
    });
    assert.equal(banRes.status, 200);
    assert.equal(env.store.isServerBanned('s1', 'u2'), true);

    // Try to re-add
    const addRes = await env.request('/api/members', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', userId: 'u2' }),
    });
    assert.equal(addRes.status, 403);

    // Unban and re-add for subsequent tests
    env.store.unbanFromServer({ serverId: 's1', targetUserId: 'u2', actorUserId: 'u1' });
    env.store.addMember({ serverId: 's1', userId: 'u2', actorUserId: 'u1' });
  });

  await t.test('POST /api/moderation/unban works', async () => {
    env.store.banFromServer({ serverId: 's1', targetUserId: 'u2', reason: 'temp', actorUserId: 'u1' });
    const res = await env.request('/api/moderation/unban', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token('u1')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId: 's1', userId: 'u2' }),
    });
    assert.equal(res.status, 200);
    assert.equal(env.store.isServerBanned('s1', 'u2'), false);
    // Re-add for subsequent tests
    env.store.addMember({ serverId: 's1', userId: 'u2', actorUserId: 'u1' });
  });

  // --- Health ---

  await t.test('GET /health returns ok', async () => {
    const res = await env.request('/health');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });
});
