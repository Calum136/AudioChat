import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import { isoToScreen, TILE_W, TILE_H } from '../lib/isoGrid';
import { ROOM_SHAPES } from '../data/roomShapes';
import { WALL_H } from '../data/sprites/wallSprites';

/**
 * Bridges roomStore state to voiceStore connection.
 * - Connects to voice when user enters a room
 * - Disconnects when user leaves the room
 * - Updates spatial audio based on seated or standing position
 * - Enforces seat-type rules (listen-only, AFK)
 */
export function useVoiceConnection() {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const furniture = useRoomStore((s) => s.furniture);
  const roomId = useRoomStore((s) => s.roomId);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const theme = useRoomStore((s) => s.theme);
  const connect = useVoiceStore((s) => s.connect);
  const disconnect = useVoiceStore((s) => s.disconnect);
  const updateSpatialAudio = useVoiceStore((s) => s.updateSpatialAudio);

  const prevRoomRef = useRef(null);

  const me = user ? participants[user.id] : null;

  // Derive origin from current theme shape
  const shape = ROOM_SHAPES[theme] || ROOM_SHAPES['gaming-den'];
  const originX = shape.gridH * (TILE_W / 2);
  const originY = shape.hasWalls ? WALL_H : 0;

  // Connect voice when entering a room, disconnect when leaving
  useEffect(() => {
    if (!user) return;

    const wasInRoom = !!prevRoomRef.current;
    const isInRoom = !!roomId;
    prevRoomRef.current = roomId;

    if (isInRoom && !wasInRoom) {
      connect(roomId, user.id);
    } else if (!isInRoom && wasInRoom) {
      disconnect();
    }
  }, [roomId, user, connect, disconnect]);

  // Handle seat type changes (listen-only, AFK)
  useEffect(() => {
    if (connectionState !== 'connected' || !me?.seatFurnitureId) return;

    const room = useVoiceStore.getState().room;
    if (!room) return;

    const seatType = me.seatType || 'sit';

    if (seatType === 'listen' || seatType === 'afk') {
      room.localParticipant.setMicrophoneEnabled(false);
      useVoiceStore.setState({ isMuted: true });
    }

    if (seatType === 'afk') {
      useVoiceStore.getState().setDeafened(true);
    } else {
      useVoiceStore.getState().setDeafened(false);
    }
  }, [connectionState, me?.seatType, me?.seatFurnitureId]);

  // Re-enable mic when leaving a listen/AFK seat (standing up or switching to normal seat)
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const room = useVoiceStore.getState().room;
    if (!room) return;

    const seatType = me?.seatType || null;
    const isSeated = !!me?.seatFurnitureId;

    // If standing or in a normal seat, un-deafen and allow mic
    if (!isSeated || (seatType !== 'listen' && seatType !== 'afk')) {
      useVoiceStore.getState().setDeafened(false);
    }
  }, [connectionState, me?.seatFurnitureId, me?.seatType]);

  // Update spatial audio when positions change — works for both seated and standing users
  useEffect(() => {
    if (connectionState !== 'connected' || !me) return;

    // Get local user's position
    const myPos = getParticipantPosition(me, furniture, originX, originY);
    if (!myPos) return;

    // Get all other participants' positions
    const participantPositions = {};
    for (const p of Object.values(participants)) {
      if (p.id === user.id) continue;
      const pos = getParticipantPosition(p, furniture, originX, originY);
      if (pos) {
        participantPositions[p.id] = pos;
      }
    }

    updateSpatialAudio(myPos, participantPositions);
  }, [connectionState, me?.seatFurnitureId, me?.seatIndex, me?.gridX, me?.gridY, furniture, participants, user, updateSpatialAudio, originX, originY]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const state = useVoiceStore.getState();
      if (state.connectionState !== 'disconnected') {
        state.disconnect();
      }
    };
  }, []);
}

/**
 * Get a participant's spatial position for audio processing.
 * Seated users: position from furniture + seat offset.
 * Standing users: position from grid coordinates via isoToScreen.
 */
function getParticipantPosition(participant, furniture, originX, originY) {
  if (participant.seatFurnitureId) {
    // Seated — use furniture position + seat offset
    const furn = furniture.find((f) => f.id === participant.seatFurnitureId);
    if (!furn) return null;
    const cat = FURNITURE_CATALOG[furn.type];
    const seat = cat?.seats?.[participant.seatIndex] || { offsetX: 0, offsetY: 0 };
    return {
      x: furn.x + seat.offsetX,
      y: furn.y + seat.offsetY,
    };
  }

  // Standing — use grid coordinates converted to screen position
  if (participant.gridX != null && participant.gridY != null) {
    const screen = isoToScreen(participant.gridX, participant.gridY, originX, originY);
    return { x: screen.x, y: screen.y };
  }

  return null;
}
