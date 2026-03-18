const { hasPermission } = require('./permissions');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class InMemoryStore {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.messages = [];
    this.voicePresence = new Map();
    this.users = new Map();
    this.servers = new Map();
    this.channels = new Map();
    this.memberships = new Map(); // key: `${serverId}:${userId}` => role
    this.userPresence = new Map(); // userId -> { status, lastHeartbeat }
    this.voiceMutes = new Set(); // `${channelId}:${userId}`
    this.serverBans = new Map(); // `${serverId}:${userId}` -> { bannedBy, bannedAt, reason }
  }

  // --- Create ---

  createUser({ id, name }) {
    if (!id || !name) throw new Error('id and name are required');
    const user = { id, name, createdAt: new Date(this.now()).toISOString() };
    this.users.set(id, user);
    return user;
  }

  createServer({ id, name, ownerId }) {
    if (!id || !name || !ownerId) {
      throw new Error('id, name and ownerId are required');
    }
    if (!this.users.has(ownerId)) {
      throw new Error('owner must exist');
    }
    const server = { id, name, ownerId, createdAt: new Date(this.now()).toISOString() };
    this.servers.set(id, server);
    this.memberships.set(`${id}:${ownerId}`, 'owner');
    return server;
  }

  addMember({ serverId, userId, role = 'member', actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'server.manage' });
    if (this.isServerBanned(serverId, userId)) throw new Error('user is banned from this server');
    this.assertServerAndUser(serverId, userId);
    this.memberships.set(`${serverId}:${userId}`, role);
    return { serverId, userId, role };
  }

  createChannel({ id, serverId, name, type = 'text', actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'channel.create' });
    if (!id || !serverId || !name) throw new Error('id, serverId and name are required');
    const channel = { id, serverId, name, type, createdAt: new Date(this.now()).toISOString() };
    this.channels.set(id, channel);
    return channel;
  }

  addMessage({ serverId, channelId, userId, content }) {
    this.assertPermission({ serverId, userId, permission: 'message.send' });
    const channel = this.channels.get(channelId);
    if (!channel || channel.serverId !== serverId) throw new Error('invalid channel');
    const message = {
      id: `${this.now()}-${Math.random().toString(36).slice(2, 10)}`,
      serverId,
      channelId,
      userId,
      content,
      createdAt: new Date(this.now()).toISOString(),
    };
    this.messages.push(message);
    return message;
  }

  // --- Read ---

  getServersForUser(userId) {
    const result = [];
    for (const [key] of this.memberships) {
      const [serverId, uId] = key.split(':');
      if (uId === userId) {
        const server = this.servers.get(serverId);
        if (server) result.push(server);
      }
    }
    return result;
  }

  getServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) throw new Error('server not found');
    return server;
  }

  getChannels({ serverId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'message.send' });
    const result = [];
    for (const [, channel] of this.channels) {
      if (channel.serverId === serverId) result.push(channel);
    }
    return result;
  }

  getMembers({ serverId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'message.send' });
    const result = [];
    for (const [key, role] of this.memberships) {
      const [sId, uId] = key.split(':');
      if (sId === serverId) {
        const user = this.users.get(uId);
        result.push({ userId: uId, role, name: user ? user.name : null });
      }
    }
    return result;
  }

  getVoicePresence({ serverId, channelId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'voice.join' });
    const result = [];
    for (const [, presence] of this.voicePresence) {
      if (presence.serverId === serverId &&
          (!channelId || presence.channelId === channelId)) {
        result.push(presence);
      }
    }
    return result;
  }

  getMessages({ serverId, channelId, userId, limit = 50, before }) {
    this.assertPermission({ serverId, userId, permission: 'message.send' });
    let msgs = this.messages
      .filter((msg) => msg.serverId === serverId && msg.channelId === channelId);
    if (before) {
      const idx = msgs.findIndex((m) => m.id === before);
      if (idx > 0) msgs = msgs.slice(0, idx);
    }
    msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return msgs.slice(-limit);
  }

  // --- Update ---

  editMessage({ messageId, content, actorUserId }) {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) throw new Error('message not found');
    if (msg.userId !== actorUserId) throw new Error('can only edit own messages');
    msg.content = content;
    msg.editedAt = new Date(this.now()).toISOString();
    return msg;
  }

  updateMemberRole({ serverId, targetUserId, role, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'server.manage' });
    const key = `${serverId}:${targetUserId}`;
    if (!this.memberships.has(key)) throw new Error('user is not a member');
    if (this.memberships.get(key) === 'owner') throw new Error('cannot change owner role');
    if (!['admin', 'member'].includes(role)) throw new Error('invalid role');
    this.memberships.set(key, role);
    return { serverId, userId: targetUserId, role };
  }

  // --- Delete ---

  deleteChannel({ channelId, actorUserId }) {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('channel not found');
    this.assertPermission({ serverId: channel.serverId, userId: actorUserId, permission: 'channel.delete' });
    this.channels.delete(channelId);
    this.messages = this.messages.filter((m) => m.channelId !== channelId);
    for (const [key, presence] of this.voicePresence) {
      if (presence.channelId === channelId) this.voicePresence.delete(key);
    }
    return { deleted: channelId };
  }

  deleteMessage({ messageId, actorUserId }) {
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) throw new Error('message not found');
    const msg = this.messages[idx];
    if (msg.userId !== actorUserId) {
      this.assertPermission({ serverId: msg.serverId, userId: actorUserId, permission: 'message.delete' });
    }
    this.messages.splice(idx, 1);
    return msg;
  }

  removeMember({ serverId, targetUserId, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'server.manage' });
    const key = `${serverId}:${targetUserId}`;
    const targetRole = this.memberships.get(key);
    if (!targetRole) throw new Error('user is not a member');
    if (targetRole === 'owner') throw new Error('cannot remove the server owner');
    this.memberships.delete(key);
    for (const [vKey, presence] of this.voicePresence) {
      if (presence.serverId === serverId && presence.userId === targetUserId) {
        this.voicePresence.delete(vKey);
      }
    }
    return { serverId, userId: targetUserId, removed: true };
  }

  // --- Voice ---

  joinVoice({ serverId, channelId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'voice.join' });
    const channel = this.channels.get(channelId);
    if (!channel || channel.type !== 'voice' || channel.serverId !== serverId) {
      throw new Error('invalid voice channel');
    }

    const key = `${channelId}:${userId}`;
    this.voicePresence.set(key, {
      serverId,
      channelId,
      userId,
      joinedAt: new Date(this.now()).toISOString(),
    });
    return { event: 'voice.joined', serverId, channelId, userId, soundCue: 'join' };
  }

  leaveVoice({ serverId, channelId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'voice.join' });
    const key = `${channelId}:${userId}`;
    this.voicePresence.delete(key);
    return { event: 'voice.left', serverId, channelId, userId, soundCue: 'leave' };
  }

  // --- Moderation ---

  muteInVoice({ serverId, channelId, targetUserId, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'voice.moderate' });
    this.voiceMutes.add(`${channelId}:${targetUserId}`);
    return { event: 'voice.muted', serverId, channelId, userId: targetUserId };
  }

  unmuteInVoice({ serverId, channelId, targetUserId, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'voice.moderate' });
    this.voiceMutes.delete(`${channelId}:${targetUserId}`);
    return { event: 'voice.unmuted', serverId, channelId, userId: targetUserId };
  }

  isVoiceMuted(channelId, userId) {
    return this.voiceMutes.has(`${channelId}:${userId}`);
  }

  kickFromVoice({ serverId, channelId, targetUserId, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'voice.moderate' });
    const key = `${channelId}:${targetUserId}`;
    this.voicePresence.delete(key);
    this.voiceMutes.delete(key);
    return { event: 'voice.kicked', serverId, channelId, userId: targetUserId, soundCue: 'leave' };
  }

  banFromServer({ serverId, targetUserId, reason, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'server.manage' });
    const targetRole = this.getRole({ serverId, userId: targetUserId });
    if (targetRole === 'owner') throw new Error('cannot ban the server owner');

    this.memberships.delete(`${serverId}:${targetUserId}`);
    for (const [key, presence] of this.voicePresence) {
      if (presence.serverId === serverId && presence.userId === targetUserId) {
        this.voicePresence.delete(key);
      }
    }

    this.serverBans.set(`${serverId}:${targetUserId}`, {
      bannedBy: actorUserId,
      bannedAt: new Date(this.now()).toISOString(),
      reason: reason || null,
    });
    return { serverId, userId: targetUserId, banned: true };
  }

  unbanFromServer({ serverId, targetUserId, actorUserId }) {
    this.assertPermission({ serverId, userId: actorUserId, permission: 'server.manage' });
    this.serverBans.delete(`${serverId}:${targetUserId}`);
    return { serverId, userId: targetUserId, unbanned: true };
  }

  isServerBanned(serverId, userId) {
    return this.serverBans.has(`${serverId}:${userId}`);
  }

  // --- Presence ---

  updatePresence(userId, status) {
    this.userPresence.set(userId, { status, lastHeartbeat: this.now() });
  }

  getPresence(userId) {
    return this.userPresence.get(userId) || { status: 'offline', lastHeartbeat: 0 };
  }

  // --- Retention ---

  purgeExpiredMessages() {
    const cutoff = this.now() - THIRTY_DAYS_MS;
    const before = this.messages.length;
    this.messages = this.messages.filter(
      (msg) => Date.parse(msg.createdAt) >= cutoff,
    );
    return before - this.messages.length;
  }

  // --- Helpers ---

  getRole({ serverId, userId }) {
    return this.memberships.get(`${serverId}:${userId}`);
  }

  assertPermission({ serverId, userId, permission }) {
    const role = this.getRole({ serverId, userId });
    if (!role) throw new Error('not a server member');
    if (!hasPermission(role, permission)) {
      throw new Error(`missing permission: ${permission}`);
    }
  }

  assertServerAndUser(serverId, userId) {
    if (!this.servers.has(serverId)) throw new Error('server not found');
    if (!this.users.has(userId)) throw new Error('user not found');
  }
}

module.exports = {
  InMemoryStore,
  THIRTY_DAYS_MS,
};
