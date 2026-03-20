import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { sittingAvatar, getAvatarPalette } from '../data/sprites/avatarSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';

const AVATAR_SCALE = 3;

export default function SeatMarker({ furnitureId, seatIndex, seat }) {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const isEditing = useRoomStore((s) => s.isEditing);
  const sitDown = useRoomStore((s) => s.sitDown);
  const standUp = useRoomStore((s) => s.standUp);
  const speakingMap = useVoiceStore((s) => s.speakingMap);

  // Find the occupant of this seat
  const occupant = Object.values(participants).find(
    (p) => p.seatFurnitureId === furnitureId && p.seatIndex === seatIndex
  );
  const iAmHere = occupant && user && occupant.id === user.id;
  const myParticipant = user ? participants[user.id] : null;
  const isSpeaking = occupant && speakingMap[occupant.id];

  // Render pixel avatar for occupant
  const avatarUrl = useMemo(() => {
    if (!occupant) return null;
    const palette = getAvatarPalette(occupant.color || '#5577bb');
    return renderPixelGrid(sittingAvatar.grid, palette, AVATAR_SCALE);
  }, [occupant]);

  const avatarW = sittingAvatar.grid[0].length * AVATAR_SCALE;
  const avatarH = sittingAvatar.grid.length * AVATAR_SCALE;

  const handleClick = () => {
    if (isEditing || !user) return;
    if (iAmHere) {
      standUp(user.id);
    } else if (!occupant) {
      if (myParticipant?.seatFurnitureId) standUp(user.id);
      sitDown(user.id, furnitureId, seatIndex);
    }
  };

  return (
    <div
      className={`seat-marker ${occupant ? 'occupied' : 'available'} ${iAmHere ? 'is-me' : ''} ${isEditing ? 'editing' : ''}`}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: seat.offsetX,
        marginTop: seat.offsetY,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
      title={occupant ? `${occupant.displayName} is here` : `${seat.label} (click to sit)`}
    >
      {occupant ? (
        <div className={`seat-avatar-pixel ${isSpeaking ? 'speaking' : ''} ${iAmHere ? 'is-me' : ''}`}>
          <img
            src={avatarUrl}
            className="avatar-sprite"
            style={{ width: avatarW, height: avatarH }}
            draggable={false}
            alt={occupant.displayName}
          />
          {isSpeaking && <div className="speaking-waves" />}
        </div>
      ) : (
        <div className="seat-dot" />
      )}
    </div>
  );
}
