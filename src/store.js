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
  }

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

  getMessages({ serverId, channelId, userId }) {
    this.assertPermission({ serverId, userId, permission: 'message.send' });
    return this.messages
      .filter((msg) => msg.serverId === serverId && msg.channelId === channelId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  purgeExpiredMessages() {
    const cutoff = this.now() - THIRTY_DAYS_MS;
    const before = this.messages.length;
    this.messages = this.messages.filter(
      (msg) => Date.parse(msg.createdAt) >= cutoff,
    );
    return before - this.messages.length;
  }

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
