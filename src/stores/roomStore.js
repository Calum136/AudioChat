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

  // Edit mode toggle (owner only)
  isEditing: false,
  toggleEditing: () => set((s) => ({ isEditing: !s.isEditing })),

  // Furniture state (from Supabase)
  furniture: [],

  // Participants from Presence — { odlkUser.id: { id, displayName, color, seatFurnitureId, seatIndex } }
  participants: {},

  // Realtime channel
  _channel: null,

  // ======== Room Lifecycle ========

  createRoom: async (name, user) => {
    const room = await roomService.createRoom(name, user.id);
    await get()._enterRoom(room, user);
  },

  joinRoom: async (joinCode, user) => {
    const room = await roomService.getRoomByJoinCode(joinCode);
    if (!room) throw new Error('Room not found');
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
    });
  },

  _enterRoom: async (room, user) => {
    // Load furniture from DB
    const furnitureRows = await roomService.loadFurniture(room.id);
    const furniture = furnitureRows.map((f) => ({
      id: f.id,
      type: f.type,
      x: f.x,
      y: f.y,
    }));

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
      onThemeChange: (payload) => {
        set({ theme: payload.theme });
      },
    });

    // Subscribe and track presence
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          displayName: user.displayName,
          color: user.color,
          seatFurnitureId: null,
          seatIndex: null,
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
