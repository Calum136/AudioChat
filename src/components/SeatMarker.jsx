import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { sittingAvatar, standingAvatar, getAvatarPalette } from '../data/sprites/avatarSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';

const AVATAR_SCALE = 3;

export default function SeatMarker({ furnitureId, seatIndex, seat }) {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const isEditing = useRoomStore((s) => s.isEditing);
  const sitDown = useRoomStore((s) => s.sitDown);
  const standUp = useRoomStore((s) => s.standUp);
  const speakingMap = useVoiceStore((s) => s.speakingMap);

  const isStandingSpot = seat.type === 'stand';

  // Find the occupant of this seat
  const occupant = Object.values(participants).find(
    (p) => p.seatFurnitureId === furnitureId && p.seatIndex === seatIndex
  );
  const iAmHere = occupant && user && occupant.id === user.id;
  const myParticipant = user ? participants[user.id] : null;
  const isSpeaking = occupant && speakingMap[occupant.id];

  // Render pixel avatar for occupant (standing or sitting based on spot type)
  const avatarTemplate = isStandingSpot ? standingAvatar : sittingAvatar;
  const avatarUrl = useMemo(() => {
    if (!occupant) return null;
    const palette = getAvatarPalette(occupant.color || '#5577bb');
    return renderPixelGrid(avatarTemplate.grid, palette, AVATAR_SCALE);
  }, [occupant, avatarTemplate]);

  const avatarW = avatarTemplate.grid[0].length * AVATAR_SCALE;
  const avatarH = avatarTemplate.grid.length * AVATAR_SCALE;

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent Room's click handler from firing moveAvatar
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
      className={`seat-marker ${occupant ? 'occupied' : 'available'} ${iAmHere ? 'is-me' : ''} ${isEditing ? 'editing' : ''} ${isStandingSpot ? 'standing-spot' : ''}`}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: seat.offsetX,
        marginTop: seat.offsetY,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
      title={occupant ? `${occupant.displayName} is here` : seat.label || (isStandingSpot ? 'Stand here' : 'Click to sit')}
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
        <div className={`seat-dot ${isStandingSpot ? 'stand-dot' : ''}`} />
      )}
    </div>
  );
}
