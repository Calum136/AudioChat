import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { FURNITURE_CATALOG } from '../data/furniture';

/**
 * Bridges roomStore seating state to voiceStore connection.
 * - Connects to voice when user sits down
 * - Disconnects when user stands up
 * - Updates spatial audio when furniture positions change
 */
export function useVoiceConnection() {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const furniture = useRoomStore((s) => s.furniture);
  const roomId = useRoomStore((s) => s.roomId);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const connect = useVoiceStore((s) => s.connect);
  const disconnect = useVoiceStore((s) => s.disconnect);
  const updateSpatialAudio = useVoiceStore((s) => s.updateSpatialAudio);

  const prevSeatRef = useRef(null);

  const me = user ? participants[user.id] : null;

  // Connect/disconnect based on seating
  useEffect(() => {
    if (!user || !roomId) return;

    const isSeated = !!me?.seatFurnitureId;
    const wasSeated = !!prevSeatRef.current;
    prevSeatRef.current = me?.seatFurnitureId;

    if (isSeated && !wasSeated) {
      connect(roomId, user.id);
    } else if (!isSeated && wasSeated) {
      disconnect();
    }
  }, [me?.seatFurnitureId, roomId, user, connect, disconnect]);

  // Update spatial audio when positions change
  useEffect(() => {
    if (connectionState !== 'connected' || !me?.seatFurnitureId) return;

    const myFurn = furniture.find((f) => f.id === me.seatFurnitureId);
    if (!myFurn) return;

    const myCat = FURNITURE_CATALOG[myFurn.type];
    const mySeat = myCat?.seats?.[me.seatIndex] || { offsetX: 0, offsetY: 0 };
    const myPos = { x: myFurn.x + mySeat.offsetX, y: myFurn.y + mySeat.offsetY };

    const participantPositions = {};
    for (const p of Object.values(participants)) {
      if (p.id === user.id || !p.seatFurnitureId) continue;
      const furn = furniture.find((f) => f.id === p.seatFurnitureId);
      if (!furn) continue;
      const cat = FURNITURE_CATALOG[furn.type];
      const seat = cat?.seats?.[p.seatIndex] || { offsetX: 0, offsetY: 0 };
      participantPositions[p.id] = {
        x: furn.x + seat.offsetX,
        y: furn.y + seat.offsetY,
      };
    }

    updateSpatialAudio(myPos, participantPositions);
  }, [connectionState, me?.seatFurnitureId, me?.seatIndex, furniture, participants, user, updateSpatialAudio]);

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
