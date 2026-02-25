const test = require('node:test');
const assert = require('node:assert/strict');
const { InMemoryStore, THIRTY_DAYS_MS } = require('../src/store');

function makeStore() {
  let now = Date.UTC(2026, 0, 31);
  const store = new InMemoryStore(() => now);
  store.createUser({ id: 'u1', name: 'Alice' });
  store.createUser({ id: 'u2', name: 'Bob' });
  store.createServer({ id: 's1', name: 'Friends', ownerId: 'u1' });
  store.addMember({ serverId: 's1', userId: 'u2', role: 'member', actorUserId: 'u1' });
  store.createChannel({ id: 't1', serverId: 's1', name: 'general', type: 'text', actorUserId: 'u1' });
  store.createChannel({ id: 'v1', serverId: 's1', name: 'lounge', type: 'voice', actorUserId: 'u1' });
  return { store, setNow: (value) => { now = value; } };
}

test('purgeExpiredMessages removes items older than 30 days', () => {
  const { store, setNow } = makeStore();
  const now = Date.UTC(2026, 0, 31);
  setNow(now);

  store.messages.push({
    id: 'old',
    serverId: 's1',
    channelId: 't1',
    createdAt: new Date(now - THIRTY_DAYS_MS - 1).toISOString(),
  });
  store.messages.push({
    id: 'fresh',
    serverId: 's1',
    channelId: 't1',
    createdAt: new Date(now - THIRTY_DAYS_MS + 1).toISOString(),
  });

  const removed = store.purgeExpiredMessages();
  assert.equal(removed, 1);
  assert.deepEqual(store.messages.map((m) => m.id), ['fresh']);
});

test('voice events include join/leave sound cues', () => {
  const { store } = makeStore();
  const joined = store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  const left = store.leaveVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });

  assert.equal(joined.event, 'voice.joined');
  assert.equal(joined.soundCue, 'join');
  assert.equal(left.event, 'voice.left');
  assert.equal(left.soundCue, 'leave');
});

test('member can send messages but cannot create channels', () => {
  const { store } = makeStore();

  const message = store.addMessage({
    serverId: 's1',
    channelId: 't1',
    userId: 'u2',
    content: 'hello',
  });

  assert.equal(message.content, 'hello');
  assert.throws(
    () => store.createChannel({
      id: 't2',
      serverId: 's1',
      name: 'private',
      type: 'text',
      actorUserId: 'u2',
    }),
    /missing permission: channel.create/,
  );
});
