import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';

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

  const handleClick = () => {
    if (isEditing || !user) return;
    if (iAmHere) {
      standUp(user.id);
    } else if (!occupant) {
      // Stand up from current seat first
      if (myParticipant?.seatFurnitureId) standUp(user.id);
      sitDown(user.id, furnitureId, seatIndex);
    }
  };

  return (
    <div
      className={`seat-marker ${occupant ? 'occupied' : 'available'} ${iAmHere ? 'is-me' : ''} ${isEditing ? 'editing' : ''}`}
      style={{
        left: seat.offsetX,
        top: seat.offsetY,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
      title={occupant ? `${occupant.displayName} is here` : `${seat.label} (click to sit)`}
    >
      {occupant ? (
        <div
          className={`seat-avatar ${isSpeaking ? 'speaking' : ''}`}
          style={{ background: occupant.color }}
        >
          {occupant.displayName[0]}
        </div>
      ) : (
        <div className="seat-dot" />
      )}
    </div>
  );
}
