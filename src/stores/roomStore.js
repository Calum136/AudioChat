import { create } from 'zustand';
import { FURNITURE_CATALOG } from '../data/furniture';
import { ROOM_SHAPES, findSpawnPosition, isInMask } from '../data/roomShapes';
import { createRoomChannel } from '../lib/roomChannel';
import * as roomService from '../lib/roomService';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { playJoinSound, playLeaveSound, playKnockSound } from '../lib/sounds';

export const useRoomStore = create((set, get) => ({
  // View routing: 'landing' | 'room'
  view: 'landing',
  setView: (view) => set({ view }),

  // Onboarding wizard overlay (shown on fresh room creation)
  onboardingActive: false,
  onboardingPrefillName: '',
  setOnboardingActive: (v, opts = {}) =>
    set({ onboardingActive: v, onboardingPrefillName: opts.prefillName || '' }),

  // Room metadata (from Supabase)
  roomId: null,
  roomName: '',
  joinCode: '',
  ownerId: null,
  theme: 'gaming-den',
  roomImageUrl: null,

  // My rooms (persisted rooms for current user)
  myRooms: [],
  myRoomsLoading: false,

  // Edit mode toggle (owner or admin)
  isEditing: false,
  isAdmin: false,
  toggleEditing: () => set((s) => ({ isEditing: !s.isEditing, selectedFurnitureType: null })),

  // Click-to-place: selected furniture type from palette
  selectedFurnitureType: null,
  setSelectedFurnitureType: (type) => set({ selectedFurnitureType: type }),

  // Furniture state (from Supabase)
  furniture: [],

  // Participants from Presence — { odlkUser.id: { id, displayName, color, seatFurnitureId, seatIndex } }
  participants: {},

  // Realtime channel
  _channel: null,

  // Knock requests (friend wants to join)
  knockRequests: [], // [{ userId, displayName, color, timestamp }]

  // User-facing error for the room (e.g. furniture placement failure)
  lastError: null,
  clearError: () => set({ lastError: null }),

  // ======== Room Lifecycle ========

  loadMyRooms: async (userId) => {
    set({ myRoomsLoading: true });
    try {
      const rooms = await roomService.getUserRooms(userId);
      set({ myRooms: rooms, myRoomsLoading: false });
    } catch (e) {
      console.error('Failed to load rooms:', e);
      set({ myRoomsLoading: false });
    }
  },

  deleteRoom: async (roomId, userId) => {
    await roomService.deleteRoom(roomId);
    const rooms = await roomService.getUserRooms(userId);
    set({ myRooms: rooms });
  },

  leaveRoomMembership: async (roomId, userId) => {
    await roomService.leaveRoomMembership(roomId, userId);
    const rooms = await roomService.getUserRooms(userId);
    set({ myRooms: rooms });
  },

  promoteAdmin: async (targetUserId) => {
    const { roomId } = get();
    if (!roomId) return;
    await roomService.setRoomMemberRole(roomId, targetUserId, 'admin');
  },

  demoteAdmin: async (targetUserId) => {
    const { roomId } = get();
    if (!roomId) return;
    await roomService.setRoomMemberRole(roomId, targetUserId, 'member');
  },

  createRoom: async (name, user) => {
    const room = await roomService.createRoom(name, user.id);
    await get()._enterRoom(room, user);
  },

  joinRoom: async (joinCode, user) => {
    const room = await roomService.getRoomByJoinCode(joinCode);
    if (!room) throw new Error('Room not found. Check the code and try again.');
    await get()._enterRoom(room, user);
  },

  rejoinRoom: async (room, user) => {
    await get()._enterRoom(room, user);
  },

  leaveRoom: () => {
    const { _channel } = get();
    if (_channel) {
      _channel.unsubscribe();
      supabase.removeChannel(_channel);
    }
    set({
      view: 'landing',
      roomId: null,
      roomName: '',
      joinCode: '',
      ownerId: null,
      theme: 'gaming-den',
      roomImageUrl: null,
      furniture: [],
      participants: {},
      isEditing: false,
      isAdmin: false,
      _channel: null,
      myRooms: [],
      knockRequests: [],
    });
  },

  _enterRoom: async (room, user) => {
    // Tear down any existing channel before creating a new one
    const stale = get()._channel;
    if (stale) {
      stale.unsubscribe();
      supabase.removeChannel(stale);
      set({ _channel: null });
    }

    // Load furniture from DB
    const furnitureRows = await roomService.loadFurniture(room.id);
    const furniture = furnitureRows.map((f) => {
      // Migration: old rooms stored pixel coords (100+), new system uses grid coords (0-7)
      const needsMigration = f.x > 20 || f.y > 20;
      return {
        id: f.id,
        type: f.type,
        x: needsMigration ? Math.min(Math.floor(f.x / 80), 7) : (f.x ?? 0),
        y: needsMigration ? Math.min(Math.floor(f.y / 80), 7) : (f.y ?? 0),
      };
    });

    // Set up Realtime channel
    const channel = createRoomChannel(room.id, {
      onPresenceSync: (state) => {
        const oldParticipants = get().participants;
        const participants = {};
        let changed = false;
        for (const [_key, presences] of Object.entries(state)) {
          for (const p of presences) {
            const next = {
              id: p.userId,
              displayName: p.displayName,
              color: p.color,
              avatar: p.avatar || null,
              seatFurnitureId: p.seatFurnitureId || null,
              seatIndex: p.seatIndex ?? null,
              seatType: p.seatType || null,
              gridX: p.gridX ?? null,
              gridY: p.gridY ?? null,
            };
            const prev = oldParticipants[p.userId];
            // Preserve the previous object reference when nothing shallow has
            // changed — keeps memoized selectors and React.memo stable so a
            // presence sync on an unrelated field doesn't re-render every seat.
            if (
              prev &&
              prev.displayName === next.displayName &&
              prev.color === next.color &&
              prev.avatar === next.avatar &&
              prev.seatFurnitureId === next.seatFurnitureId &&
              prev.seatIndex === next.seatIndex &&
              prev.seatType === next.seatType &&
              prev.gridX === next.gridX &&
              prev.gridY === next.gridY
            ) {
              participants[p.userId] = prev;
            } else {
              participants[p.userId] = next;
              changed = true;
            }
          }
        }
        // Play sounds for joins/leaves (skip self)
        const myId = user.id;
        const oldIds = Object.keys(oldParticipants);
        const newIds = Object.keys(participants);
        const oldIdSet = new Set(oldIds);
        const newIdSet = new Set(newIds);
        for (const id of newIds) {
          if (id !== myId && !oldIdSet.has(id)) playJoinSound();
        }
        for (const id of oldIds) {
          if (id !== myId && !newIdSet.has(id)) playLeaveSound();
        }
        if (oldIds.length !== newIds.length) changed = true;
        if (!changed) return;
        set({ participants });
      },
      onFurnitureAdd: (payload) => {
        set((s) => ({
          furniture: [...s.furniture, { id: payload.id, type: payload.type, x: payload.x, y: payload.y }],
        }));
      },
      onFurnitureMove: (payload) => {
        set((s) => ({
          furniture: s.furniture.map((f) =>
            f.id === payload.id ? { ...f, x: payload.x, y: payload.y } : f
          ),
        }));
      },
      onFurnitureRemove: (payload) => {
        set((s) => ({
          furniture: s.furniture.filter((f) => f.id !== payload.id),
        }));
      },
      onFurnitureFlip: (payload) => {
        set((s) => ({
          furniture: s.furniture.map((f) =>
            f.id === payload.id ? { ...f, flipped: payload.flipped } : f
          ),
        }));
      },
      onThemeChange: (payload) => {
        const newTheme = payload.theme;
        const shape = ROOM_SHAPES[newTheme] || ROOM_SHAPES['gaming-den'];
        set({ theme: newTheme });
        // Re-position standing users whose grid position is now outside the new shape
        const me = get().participants[user.id];
        if (me && !me.seatFurnitureId && me.gridX != null) {
          const inBounds = me.gridX >= 0 && me.gridX < shape.gridW && me.gridY >= 0 && me.gridY < shape.gridH;
          if (!inBounds || !isInMask(me.gridX, me.gridY, shape.mask)) {
            const spawn = findSpawnPosition(shape, 0);
            get().moveAvatar(user.id, spawn.gx, spawn.gy);
          }
        }
      },
      onKnock: (payload) => {
        // Someone is knocking to join — play sound and add to list
        playKnockSound();
        set((s) => ({
          knockRequests: [
            ...s.knockRequests.filter((k) => k.userId !== payload.userId),
            { userId: payload.userId, displayName: payload.displayName, color: payload.color, timestamp: Date.now() },
          ],
        }));
      },
    });

    // Subscribe and track presence (with timeout to handle stale connections)
    const roomTheme = room.theme || 'gaming-den';
    const shape = ROOM_SHAPES[roomTheme] || ROOM_SHAPES['gaming-den'];
    const hash = parseInt((user.id || '').replace(/\D/g, '').slice(0, 4) || '0', 10);
    const spawn = findSpawnPosition(shape, hash);
    const spawnX = spawn.gx;
    const spawnY = spawn.gy;

    const subscribeWithTimeout = () => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out. Please try again.')), 8000);
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          await channel.track({
            userId: user.id,
            displayName: user.displayName,
            color: user.color,
            avatar: user.avatar || null,
            seatFurnitureId: null,
            seatIndex: null,
            gridX: spawnX,
            gridY: spawnY,
          });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error('Failed to connect. Please try again.'));
        }
      });
    });

    try {
      await subscribeWithTimeout();
    } catch (e) {
      // Clean up failed channel
      channel.unsubscribe();
      throw e;
    }

    // Save membership (so room appears in "My Rooms" for non-owners)
    const isOwner = room.owner_id === user.id;
    if (!isOwner) {
      roomService.joinRoomMembership(room.id, user.id);
    }

    // Fetch admin role
    let isAdmin = false;
    if (!isOwner) {
      const role = await roomService.getRoomMemberRole(room.id, user.id);
      isAdmin = role === 'admin';
    }

    set({
      view: 'room',
      roomId: room.id,
      roomName: room.name,
      joinCode: room.join_code,
      ownerId: room.owner_id,
      theme: room.theme || 'gaming-den',
      roomImageUrl: room.image_url || null,
      furniture,
      isAdmin,
      _channel: channel,
    });
  },

  updateRoomName: async (newName) => {
    const { roomId } = get();
    if (!roomId) return;
    await roomService.updateRoomName(roomId, newName);
    set({ roomName: newName });
  },

  updateRoomImageUrl: async (imageUrl) => {
    const { roomId } = get();
    if (!roomId) return;
    await roomService.updateRoomImageUrl(roomId, imageUrl);
    set({ roomImageUrl: imageUrl });
  },

  // ======== Furniture CRUD (owner broadcasts + persists) ========

  addFurniture: async (type, x, y) => {
    const { roomId, _channel } = get();
    if (!roomId || !_channel) {
      set({ lastError: 'Not connected to room — try rejoining.' });
      return { success: false };
    }
    try {
      const saved = await roomService.saveFurnitureAdd(roomId, type, x, y);
      const item = { id: saved.id, type, x, y };
      set((s) => ({ furniture: [...s.furniture, item], lastError: null }));
      _channel.send({ type: 'broadcast', event: 'furniture:add', payload: item });
      return { success: true };
    } catch (err) {
      console.error('[roomStore] addFurniture failed:', err);
      const msg = err?.message || 'Failed to place furniture.';
      // Supabase RLS denial — the only owner can insert furniture currently
      const friendly = /row-level security|permission|policy/i.test(msg)
        ? 'Only the room owner can place furniture right now.'
        : msg;
      set({ lastError: friendly });
      return { success: false, error: friendly };
    }
  },

  moveFurniture: async (id, x, y) => {
    const { _channel } = get();
    // Update locally immediately
    set((s) => ({
      furniture: s.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
    }));
    // Persist + broadcast
    await roomService.saveFurnitureMove(id, x, y);
    _channel.send({ type: 'broadcast', event: 'furniture:move', payload: { id, x, y } });
  },

  flipFurniture: (id) => {
    const { _channel } = get();
    set((s) => ({
      furniture: s.furniture.map((f) =>
        f.id === id ? { ...f, flipped: !f.flipped } : f
      ),
    }));
    if (_channel) {
      const item = get().furniture.find((f) => f.id === id);
      if (item) {
        _channel.send({ type: 'broadcast', event: 'furniture:flip', payload: { id, flipped: item.flipped } });
      }
    }
  },

  removeFurniture: async (id) => {
    const { _channel } = get();
    // Remove locally immediately
    set((s) => ({
      furniture: s.furniture.filter((f) => f.id !== id),
    }));
    // Persist + broadcast
    await roomService.saveFurnitureRemove(id);
    _channel.send({ type: 'broadcast', event: 'furniture:remove', payload: { id } });
  },

  // ======== Seating (updates Presence, not DB) ========

  // Helper to get current user's presence data with auth fallback
  _getMe: (userId) => {
    const { participants } = get();
    const me = participants[userId];
    if (me) return me;
    // Fallback: user joined room but presence hasn't synced yet
    const authUser = useAuthStore.getState().user;
    if (authUser && authUser.id === userId) {
      return { id: authUser.id, displayName: authUser.displayName, color: authUser.color, avatar: authUser.avatar || null, gridX: 4, gridY: 4, seatFurnitureId: null, seatIndex: null };
    }
    return null;
  },

  sitDown: (userId, furnitureId, seatIndex) => {
    const { _channel, furniture } = get();
    const me = get()._getMe(userId);
    if (!me || !_channel) return;

    // Determine seat type from furniture catalog
    const furn = furniture.find((f) => f.id === furnitureId);
    const cat = furn ? FURNITURE_CATALOG[furn.type] : null;
    const seatType = cat?.seats?.[seatIndex]?.type || 'sit';

    _channel.track({
      userId: me.id,
      displayName: me.displayName,
      color: me.color,
      avatar: me.avatar || null,
      seatFurnitureId: furnitureId,
      seatIndex,
      seatType,
      gridX: me.gridX,
      gridY: me.gridY,
    });
  },

  standUp: (userId) => {
    const { _channel } = get();
    const me = get()._getMe(userId);
    if (!me || !_channel) return;
    _channel.track({
      userId: me.id,
      displayName: me.displayName,
      color: me.color,
      avatar: me.avatar || null,
      seatFurnitureId: null,
      seatIndex: null,
      gridX: me.gridX,
      gridY: me.gridY,
    });
  },

  moveAvatar: (userId, gridX, gridY) => {
    const { _channel } = get();
    if (!_channel || !get()._getMe(userId)) return;

    // Update local participants immediately for instant visual feedback
    set((s) => ({
      participants: {
        ...s.participants,
        [userId]: { ...s.participants[userId], gridX, gridY },
      },
      _moveTargetX: gridX,
      _moveTargetY: gridY,
    }));

    // Debounce the presence broadcast — avoids triggering a full
    // onPresenceSync re-render on every rapid click. Read fresh state
    // inside the timeout so display name / avatar / seat updates are
    // never sent stale.
    clearTimeout(get()._moveTimer);
    const timer = setTimeout(() => {
      const state = get();
      if (!state._channel) return;
      const fresh = state._getMe(userId);
      if (!fresh) return;
      const tx = state._moveTargetX ?? gridX;
      const ty = state._moveTargetY ?? gridY;
      state._channel.track({
        userId: fresh.id,
        displayName: fresh.displayName,
        color: fresh.color,
        avatar: fresh.avatar || null,
        seatFurnitureId: fresh.seatFurnitureId,
        seatIndex: fresh.seatIndex,
        gridX: tx,
        gridY: ty,
      });
    }, 80);
    set({ _moveTimer: timer });
  },

  // ======== Theme (owner broadcasts + persists) ========

  setTheme: async (newTheme) => {
    const { roomId, _channel, participants, theme: previousTheme } = get();
    if (!roomId || !_channel) return;
    const shape = ROOM_SHAPES[newTheme] || ROOM_SHAPES['gaming-den'];

    try {
      // Persist first so a DB/RLS failure never strands the client in a state
      // no one else sees.
      await roomService.updateRoomTheme(roomId, newTheme);
    } catch (err) {
      console.error('[roomStore] setTheme failed:', err);
      set({ lastError: 'Failed to change theme. Only the room owner can change it.' });
      return;
    }

    set({ theme: newTheme, lastError: null });

    // Re-position standing users whose grid position is now outside the new shape
    const userId = useAuthStore.getState().user?.id;
    if (userId && participants[userId]) {
      const me = participants[userId];
      if (!me.seatFurnitureId && me.gridX != null) {
        const inBounds = me.gridX >= 0 && me.gridX < shape.gridW && me.gridY >= 0 && me.gridY < shape.gridH;
        if (!inBounds || !isInMask(me.gridX, me.gridY, shape.mask)) {
          const spawn = findSpawnPosition(shape, 0);
          get().moveAvatar(userId, spawn.gx, spawn.gy);
        }
      }
    }

    _channel.send({ type: 'broadcast', event: 'room:theme', payload: { theme: newTheme } });
    void previousTheme; // reserved for future rollback if needed
  },

  setRoomName: (roomName) => set({ roomName }),

  // ======== Knock requests ========

  dismissKnock: (userId) => {
    set((s) => ({
      knockRequests: s.knockRequests.filter((k) => k.userId !== userId),
    }));
  },

  sendInvite: async (knockerUserId, joinCode) => {
    const ch = supabase.channel(`invite:${knockerUserId}`);
    try {
      await subscribeWithTimeout(ch, 5000);
      await ch.send({ type: 'broadcast', event: 'room:invite', payload: { joinCode } });
    } finally {
      supabase.removeChannel(ch);
    }
  },

  /** Send a knock to a room (called from friends panel, targeting a specific room channel) */
  sendKnock: async (targetRoomId, user) => {
    // Use a unique channel name so we never collide with the main room:${id} channel
    const knockChannel = supabase.channel(`knock:${targetRoomId}:${Date.now()}`);
    try {
      await subscribeWithTimeout(knockChannel, 5000);
      await knockChannel.send({
        type: 'broadcast',
        event: 'room:knock',
        payload: { userId: user.id, displayName: user.displayName, color: user.color },
      });
    } finally {
      supabase.removeChannel(knockChannel);
    }
  },
}));

// Helper: subscribe to a Supabase channel with a timeout + terminal-status rejection,
// so callers never hang forever when a channel fails or is slow to connect.
function subscribeWithTimeout(channel, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Channel subscribe timed out'));
    }, timeoutMs);
    channel.subscribe((status) => {
      if (settled) return;
      if (status === 'SUBSCRIBED') {
        settled = true;
        clearTimeout(timer);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Channel ${status.toLowerCase()}`));
      }
    });
  });
}
