import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as friendService from '../lib/friendService';

export const useFriendStore = create((set, get) => ({
  friends: [],         // { friendshipId, id, displayName, color }
  pendingRequests: [],  // incoming requests
  blockedUsers: [],
  mutedUsers: new Set(), // client-side only, per-session
  onlineUsers: {},      // { [userId]: { roomId } }
  searchResults: [],
  searchLoading: false,
  loading: false,

  _globalChannel: null,

  // ======== Load all friend data ========

  loadFriends: async (userId, silent = false) => {
    if (!silent) set({ loading: true });
    try {
      const [friends, pending, blocked] = await Promise.all([
        friendService.getFriends(userId),
        friendService.getPendingRequests(userId),
        friendService.getBlockedUsers(userId),
      ]);
      set({ friends, pendingRequests: pending, blockedUsers: blocked, loading: false });
    } catch (e) {
      console.error('[friends] Failed to load:', e);
      if (!silent) set({ loading: false });
    }
  },

  // ======== Search ========

  searchUsers: async (query, currentUserId) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ searchLoading: true });
    try {
      const results = await friendService.searchUsers(query, currentUserId);
      // Filter out blocked users and existing friends
      const { friends, pendingRequests, blockedUsers } = get();
      const knownIds = new Set([
        ...friends.map((f) => f.id),
        ...pendingRequests.map((r) => r.id),
        ...blockedUsers.map((b) => b.id),
      ]);
      set({
        searchResults: results
          .filter((u) => !knownIds.has(u.id))
          .map((u) => ({ id: u.id, displayName: u.display_name, color: u.color })),
        searchLoading: false,
      });
    } catch (e) {
      console.error('[friends] Search failed:', e);
      set({ searchLoading: false });
    }
  },

  // ======== Friend actions ========

  sendRequest: async (currentUserId, addresseeId) => {
    try {
      await friendService.sendFriendRequest(currentUserId, addresseeId);
      // Remove from search results
      set((s) => ({
        searchResults: s.searchResults.filter((u) => u.id !== addresseeId),
      }));
    } catch (e) {
      console.error('[friends] Send request failed:', e);
      throw e;
    }
  },

  acceptRequest: async (friendshipId, userId) => {
    try {
      await friendService.acceptRequest(friendshipId);
      await get().loadFriends(userId);
    } catch (e) {
      console.error('[friends] Accept failed:', e);
    }
  },

  declineRequest: async (friendshipId, userId) => {
    try {
      await friendService.removeFriendship(friendshipId);
      set((s) => ({
        pendingRequests: s.pendingRequests.filter((r) => r.friendshipId !== friendshipId),
      }));
    } catch (e) {
      console.error('[friends] Decline failed:', e);
    }
  },

  removeFriend: async (friendshipId, userId) => {
    try {
      await friendService.removeFriendship(friendshipId);
      set((s) => ({
        friends: s.friends.filter((f) => f.friendshipId !== friendshipId),
      }));
    } catch (e) {
      console.error('[friends] Remove failed:', e);
    }
  },

  blockUser: async (currentUserId, targetUserId) => {
    try {
      await friendService.blockUser(currentUserId, targetUserId);
      await get().loadFriends(currentUserId);
    } catch (e) {
      console.error('[friends] Block failed:', e);
    }
  },

  unblockUser: async (friendshipId, currentUserId) => {
    try {
      await friendService.unblockUser(friendshipId);
      set((s) => ({
        blockedUsers: s.blockedUsers.filter((b) => b.friendshipId !== friendshipId),
      }));
    } catch (e) {
      console.error('[friends] Unblock failed:', e);
    }
  },

  // ======== Mute (client-side only) ========

  toggleMute: (userId) => {
    set((s) => {
      const next = new Set(s.mutedUsers);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { mutedUsers: next };
    });
  },

  isMuted: (userId) => get().mutedUsers.has(userId),

  // ======== Global Presence ========

  connectGlobalPresence: (user, roomId = null) => {
    const existing = get()._globalChannel;
    if (existing) return; // already connected

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: user.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const online = {};
      for (const [_key, presences] of Object.entries(state)) {
        for (const p of presences) {
          online[p.userId] = { roomId: p.roomId || null };
        }
      }
      set({ onlineUsers: online });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          roomId,
        });
      }
    });

    set({ _globalChannel: channel });
  },

  updatePresenceRoom: async (roomId) => {
    const channel = get()._globalChannel;
    if (!channel) return;
    await channel.track({
      userId: channel.presenceState()[Object.keys(channel.presenceState())[0]]?.[0]?.userId,
      roomId,
    });
  },

  disconnectGlobalPresence: () => {
    const channel = get()._globalChannel;
    if (channel) {
      channel.unsubscribe();
    }
    set({ _globalChannel: null, onlineUsers: {} });
  },

  // ======== Helpers ========

  getFriendWithStatus: (friendId) => {
    const { onlineUsers } = get();
    const online = onlineUsers[friendId];
    return online ? { online: true, roomId: online.roomId } : { online: false, roomId: null };
  },
}));
