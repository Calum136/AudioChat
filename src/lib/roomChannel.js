import { supabase } from './supabase';

/**
 * Creates and configures a Supabase Realtime channel for a room.
 * Handles Presence (who's in the room + seating) and Broadcast (furniture/theme changes).
 */
export function createRoomChannel(roomId, callbacks) {
  const {
    onPresenceSync,
    onFurnitureAdd,
    onFurnitureMove,
    onFurnitureRemove,
    onFurnitureFlip,
    onThemeChange,
  } = callbacks;

  const channel = supabase.channel(`room:${roomId}`);

  // Presence — who is in the room and where they're sitting
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    onPresenceSync(state);
  });

  // Broadcast — furniture and theme changes from room owner
  channel.on('broadcast', { event: 'furniture:add' }, ({ payload }) => {
    onFurnitureAdd(payload);
  });

  channel.on('broadcast', { event: 'furniture:move' }, ({ payload }) => {
    onFurnitureMove(payload);
  });

  channel.on('broadcast', { event: 'furniture:remove' }, ({ payload }) => {
    onFurnitureRemove(payload);
  });

  channel.on('broadcast', { event: 'furniture:flip' }, ({ payload }) => {
    onFurnitureFlip(payload);
  });

  channel.on('broadcast', { event: 'room:theme' }, ({ payload }) => {
    onThemeChange(payload);
  });

  return channel;
}
