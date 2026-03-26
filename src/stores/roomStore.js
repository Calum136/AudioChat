import { create } from 'zustand';
import { FURNITURE_CATALOG } from '../data/furniture';
import { createRoomChannel } from '../lib/roomChannel';
import * as roomService from '../lib/roomService';

export const useRoomStore = create((set, get) => ({
  // View routing: 'landing' | 'room'
  view: 'landing',
  setView: (view) => set({ view }),

  // Room metadata (from Supabase)
  roomId: null,
  roomName: '',
  joinCode: '',
  ownerId: null,
  theme: 'gaming-den',

  // My rooms (persisted rooms for current user)
  myRooms: [],
  myRoomsLoading: false,

  // Edit mode toggle (owner only)
  isEditing: false,
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
    // Refresh room list
    const rooms = await roomService.getUserRooms(userId);
    set({ myRooms: rooms });
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
    }
    set({
      view: 'landing',
      roomId: null,
      roomName: '',
      joinCode: '',
      ownerId: null,
      theme: 'gaming-den',
      furniture: [],
      participants: {},
      isEditing: false,
      _channel: null,
      myRooms: [],
    });
  },

  _enterRoom: async (room, user) => {
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
        const participants = {};
        for (const [_key, presences] of Object.entries(state)) {
          for (const p of presences) {
            participants[p.userId] = {
              id: p.userId,
              displayName: p.displayName,
              color: p.color,
              seatFurnitureId: p.seatFurnitureId || null,
              seatIndex: p.seatIndex ?? null,
              gridX: p.gridX ?? null,
              gridY: p.gridY ?? null,
            };
          }
        }
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
        set({ theme: payload.theme });
      },
    });

    // Subscribe and track presence
    // Pick a spawn position (center-ish of room, offset by user hash to avoid overlap)
    const hash = parseInt((user.id || '').replace(/\D/g, '').slice(0, 4) || '0', 10);
    const spawnX = 3 + (hash % 3);
    const spawnY = 3 + (Math.floor(hash / 3) % 3);

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          displayName: user.displayName,
          color: user.color,
          seatFurnitureId: null,
          seatIndex: null,
          gridX: spawnX,
          gridY: spawnY,
        });
      }
    });

    set({
      view: 'room',
      roomId: room.id,
      roomName: room.name,
      joinCode: room.join_code,
      ownerId: room.owner_id,
      theme: room.theme || 'gaming-den',
      furniture,
      _channel: channel,
    });
  },

  // ======== Furniture CRUD (owner broadcasts + persists) ========

  addFurniture: async (type, x, y) => {
    const { roomId, _channel } = get();
    const saved = await roomService.saveFurnitureAdd(roomId, type, x, y);
    const item = { id: saved.id, type, x, y };
    // Add locally immediately
    set((s) => ({ furniture: [...s.furniture, item] }));
    // Broadcast to others
    _channel.send({ type: 'broadcast', event: 'furniture:add', payload: item });
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

  sitDown: (userId, furnitureId, seatIndex) => {
    const { _channel, participants } = get();
    const me = participants[userId];
    if (!me || !_channel) return;
    _channel.track({
      userId: me.id,
      displayName: me.displayName,
      color: me.color,
      seatFurnitureId: furnitureId,
      seatIndex,
      gridX: me.gridX,
      gridY: me.gridY,
    });
  },

  standUp: (userId) => {
    const { _channel, participants } = get();
    const me = participants[userId];
    if (!me || !_channel) return;
    _channel.track({
      userId: me.id,
      displayName: me.displayName,
      color: me.color,
      seatFurnitureId: null,
      seatIndex: null,
      gridX: me.gridX,
      gridY: me.gridY,
    });
  },

  moveAvatar: (userId, gridX, gridY) => {
    const { _channel, participants } = get();
    const me = participants[userId];
    if (!me || !_channel) return;
    _channel.track({
      userId: me.id,
      displayName: me.displayName,
      color: me.color,
      seatFurnitureId: me.seatFurnitureId,
      seatIndex: me.seatIndex,
      gridX,
      gridY,
    });
  },

  // ======== Theme (owner broadcasts + persists) ========

  setTheme: async (theme) => {
    const { roomId, _channel } = get();
    set({ theme });
    await roomService.updateRoomTheme(roomId, theme);
    _channel.send({ type: 'broadcast', event: 'room:theme', payload: { theme } });
  },

  setRoomName: (roomName) => set({ roomName }),
}));
