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

// --- Original tests ---

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

// --- Creation validation ---

test('createUser rejects missing fields', () => {
  const { store } = makeStore();
  assert.throws(() => store.createUser({ id: 'x' }), /id and name are required/);
  assert.throws(() => store.createUser({ name: 'x' }), /id and name are required/);
});

test('createServer rejects non-existent owner', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.createServer({ id: 's99', name: 'Bad', ownerId: 'nonexistent' }),
    /owner must exist/,
  );
});

test('createServer rejects missing fields', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.createServer({ id: 's99', name: 'Bad' }),
    /id, name and ownerId are required/,
  );
});

// --- Voice validation ---

test('joinVoice rejects text channel', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.joinVoice({ serverId: 's1', channelId: 't1', userId: 'u2' }),
    /invalid voice channel/,
  );
});

test('joinVoice rejects non-existent channel', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.joinVoice({ serverId: 's1', channelId: 'nope', userId: 'u2' }),
    /invalid voice channel/,
  );
});

// --- Permission boundaries ---

test('non-member cannot send messages', () => {
  const { store } = makeStore();
  store.createUser({ id: 'u3', name: 'Charlie' });
  assert.throws(
    () => store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u3', content: 'hi' }),
    /not a server member/,
  );
});

test('cross-server isolation: member of s1 cannot access s2', () => {
  const { store } = makeStore();
  store.createUser({ id: 'u3', name: 'Charlie' });
  store.createServer({ id: 's2', name: 'Other', ownerId: 'u3' });
  store.createChannel({ id: 't2', serverId: 's2', name: 'general', type: 'text', actorUserId: 'u3' });
  assert.throws(
    () => store.getMessages({ serverId: 's2', channelId: 't2', userId: 'u2' }),
    /not a server member/,
  );
});

test('member cannot manage server', () => {
  const { store } = makeStore();
  store.createUser({ id: 'u3', name: 'Charlie' });
  assert.throws(
    () => store.addMember({ serverId: 's1', userId: 'u3', actorUserId: 'u2' }),
    /missing permission: server.manage/,
  );
});

// --- Read methods ---

test('getServersForUser returns only member servers', () => {
  const { store } = makeStore();
  store.createUser({ id: 'u3', name: 'Charlie' });
  store.createServer({ id: 's2', name: 'Other', ownerId: 'u3' });

  const u1Servers = store.getServersForUser('u1');
  assert.equal(u1Servers.length, 1);
  assert.equal(u1Servers[0].id, 's1');

  const u3Servers = store.getServersForUser('u3');
  assert.equal(u3Servers.length, 1);
  assert.equal(u3Servers[0].id, 's2');
});

test('getServer throws for non-existent server', () => {
  const { store } = makeStore();
  assert.throws(() => store.getServer('nope'), /server not found/);
});

test('getChannels returns all channels in a server', () => {
  const { store } = makeStore();
  const channels = store.getChannels({ serverId: 's1', userId: 'u1' });
  assert.equal(channels.length, 2);
});

test('getMembers returns all members with roles', () => {
  const { store } = makeStore();
  const members = store.getMembers({ serverId: 's1', userId: 'u1' });
  assert.equal(members.length, 2);
  const owner = members.find((m) => m.userId === 'u1');
  assert.equal(owner.role, 'owner');
  const member = members.find((m) => m.userId === 'u2');
  assert.equal(member.role, 'member');
});

test('getVoicePresence returns users in voice channels', () => {
  const { store } = makeStore();
  store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  const presence = store.getVoicePresence({ serverId: 's1', channelId: 'v1', userId: 'u1' });
  assert.equal(presence.length, 1);
  assert.equal(presence[0].userId, 'u2');
});

// --- Pagination ---

test('getMessages pagination returns limited results', () => {
  const { store } = makeStore();
  for (let i = 0; i < 10; i++) {
    store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: `msg-${i}` });
  }
  const page = store.getMessages({ serverId: 's1', channelId: 't1', userId: 'u2', limit: 3 });
  assert.equal(page.length, 3);
  assert.equal(page[2].content, 'msg-9'); // most recent
});

// --- Update methods ---

test('editMessage updates content and adds editedAt', () => {
  const { store } = makeStore();
  const msg = store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'original' });
  const edited = store.editMessage({ messageId: msg.id, content: 'edited', actorUserId: 'u2' });
  assert.equal(edited.content, 'edited');
  assert.ok(edited.editedAt);
});

test('editMessage rejects non-author', () => {
  const { store } = makeStore();
  const msg = store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'mine' });
  assert.throws(
    () => store.editMessage({ messageId: msg.id, content: 'hacked', actorUserId: 'u1' }),
    /can only edit own messages/,
  );
});

test('updateMemberRole promotes to admin', () => {
  const { store } = makeStore();
  const result = store.updateMemberRole({ serverId: 's1', targetUserId: 'u2', role: 'admin', actorUserId: 'u1' });
  assert.equal(result.role, 'admin');
  assert.equal(store.getRole({ serverId: 's1', userId: 'u2' }), 'admin');
});

test('updateMemberRole rejects invalid roles', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.updateMemberRole({ serverId: 's1', targetUserId: 'u2', role: 'superadmin', actorUserId: 'u1' }),
    /invalid role/,
  );
});

test('updateMemberRole cannot change owner role', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.updateMemberRole({ serverId: 's1', targetUserId: 'u1', role: 'member', actorUserId: 'u1' }),
    /cannot change owner role/,
  );
});

// --- Delete methods ---

test('deleteMessage allows author to delete own message', () => {
  const { store } = makeStore();
  const msg = store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'delete me' });
  const deleted = store.deleteMessage({ messageId: msg.id, actorUserId: 'u2' });
  assert.equal(deleted.id, msg.id);
  assert.equal(store.messages.length, 0);
});

test('deleteMessage allows owner to delete any message', () => {
  const { store } = makeStore();
  const msg = store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'owned' });
  const deleted = store.deleteMessage({ messageId: msg.id, actorUserId: 'u1' });
  assert.equal(deleted.id, msg.id);
});

test('deleteMessage rejects member deleting others message', () => {
  const { store } = makeStore();
  const msg = store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u1', content: 'owner msg' });
  assert.throws(
    () => store.deleteMessage({ messageId: msg.id, actorUserId: 'u2' }),
    /missing permission: message.delete/,
  );
});

test('deleteChannel cascades to messages and voice presence', () => {
  const { store } = makeStore();
  store.addMessage({ serverId: 's1', channelId: 't1', userId: 'u2', content: 'will be deleted' });
  store.deleteChannel({ channelId: 't1', actorUserId: 'u1' });
  assert.equal(store.channels.has('t1'), false);
  assert.equal(store.messages.length, 0);
});

test('removeMember cannot remove owner', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.removeMember({ serverId: 's1', targetUserId: 'u1', actorUserId: 'u1' }),
    /cannot remove the server owner/,
  );
});

test('removeMember kicks user and cleans up voice', () => {
  const { store } = makeStore();
  store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  const result = store.removeMember({ serverId: 's1', targetUserId: 'u2', actorUserId: 'u1' });
  assert.equal(result.removed, true);
  assert.equal(store.getRole({ serverId: 's1', userId: 'u2' }), undefined);
  assert.equal(store.voicePresence.size, 0);
});

// --- Moderation ---

test('muteInVoice requires voice.moderate permission', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.muteInVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u1', actorUserId: 'u2' }),
    /missing permission: voice.moderate/,
  );
});

test('owner can mute and unmute in voice', () => {
  const { store } = makeStore();
  store.muteInVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u2', actorUserId: 'u1' });
  assert.equal(store.isVoiceMuted('v1', 'u2'), true);
  store.unmuteInVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u2', actorUserId: 'u1' });
  assert.equal(store.isVoiceMuted('v1', 'u2'), false);
});

test('kickFromVoice removes presence and mute state', () => {
  const { store } = makeStore();
  store.joinVoice({ serverId: 's1', channelId: 'v1', userId: 'u2' });
  store.muteInVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u2', actorUserId: 'u1' });
  store.kickFromVoice({ serverId: 's1', channelId: 'v1', targetUserId: 'u2', actorUserId: 'u1' });
  assert.equal(store.voicePresence.size, 0);
  assert.equal(store.isVoiceMuted('v1', 'u2'), false);
});

test('banFromServer removes membership and blocks rejoin', () => {
  const { store } = makeStore();
  store.banFromServer({ serverId: 's1', targetUserId: 'u2', reason: 'testing', actorUserId: 'u1' });
  assert.equal(store.isServerBanned('s1', 'u2'), true);
  assert.equal(store.getRole({ serverId: 's1', userId: 'u2' }), undefined);
  assert.throws(
    () => store.addMember({ serverId: 's1', userId: 'u2', actorUserId: 'u1' }),
    /user is banned from this server/,
  );
});

test('unbanFromServer allows rejoining', () => {
  const { store } = makeStore();
  store.banFromServer({ serverId: 's1', targetUserId: 'u2', reason: 'temp', actorUserId: 'u1' });
  store.unbanFromServer({ serverId: 's1', targetUserId: 'u2', actorUserId: 'u1' });
  assert.equal(store.isServerBanned('s1', 'u2'), false);
  const result = store.addMember({ serverId: 's1', userId: 'u2', actorUserId: 'u1' });
  assert.equal(result.role, 'member');
});

test('cannot ban the server owner', () => {
  const { store } = makeStore();
  assert.throws(
    () => store.banFromServer({ serverId: 's1', targetUserId: 'u1', actorUserId: 'u1' }),
    /cannot ban the server owner/,
  );
});

// --- Presence ---

test('updatePresence and getPresence track user status', () => {
  const { store } = makeStore();
  assert.equal(store.getPresence('u1').status, 'offline');
  store.updatePresence('u1', 'online');
  assert.equal(store.getPresence('u1').status, 'online');
  store.updatePresence('u1', 'idle');
  assert.equal(store.getPresence('u1').status, 'idle');
});
