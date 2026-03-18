import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import Icon from './Icon';

export default function ParticipantPanel() {
  const user = useAuthStore((s) => s.user);
  const participants = useRoomStore((s) => s.participants);
  const furniture = useRoomStore((s) => s.furniture);
  const standUp = useRoomStore((s) => s.standUp);
  const speakingMap = useVoiceStore((s) => s.speakingMap);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const isMuted = useVoiceStore((s) => s.isMuted);

  const participantList = Object.values(participants);
  const seated = participantList.filter((p) => p.seatFurnitureId);
  const standing = participantList.filter((p) => !p.seatFurnitureId);

  const getSeatLabel = (participant) => {
    const furn = furniture.find((f) => f.id === participant.seatFurnitureId);
    if (!furn) return '';
    const cat = FURNITURE_CATALOG[furn.type];
    return cat ? cat.name : '';
  };

  const isMe = (p) => user && p.id === user.id;

  return (
    <div className="friend-panel">
      <h3 className="panel-title">
        <span className="pulse-dot" />
        In the Room ({participantList.length})
      </h3>

      {seated.length > 0 && (
        <div className="friend-section">
          {seated.map((p) => {
            const me = isMe(p);
            const isSpeaking = connectionState === 'connected' && speakingMap[p.id];
            return (
              <div
                key={p.id}
                className={`friend-row seated ${me ? 'is-me' : ''} ${isSpeaking ? 'speaking' : ''}`}
              >
                <div className="friend-avatar" style={{ background: p.color }}>
                  {p.displayName[0]}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{p.displayName}{me ? ' (you)' : ''}</span>
                  <span className="friend-seat">
                    {getSeatLabel(p)}
                    {me && connectionState === 'connected' && (
                      <Icon name={isMuted ? 'micOff' : 'mic'} size={10} className="friend-mic-icon" />
                    )}
                  </span>
                </div>
                {isSpeaking && (
                  <span className="voice-indicator">
                    <Icon name="speaking" size={14} />
                  </span>
                )}
                {me && (
                  <button
                    className="stand-btn"
                    onClick={() => standUp(user.id)}
                    title="Stand up"
                  >
                    <Icon name="arrowUp" size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {standing.length > 0 && (
        <div className="friend-section">
          <h4 className="section-label">Standing</h4>
          {standing.map((p) => {
            const me = isMe(p);
            return (
              <div
                key={p.id}
                className={`friend-row standing ${me ? 'is-me' : ''}`}
              >
                <div className="friend-avatar" style={{ background: p.color }}>
                  {p.displayName[0]}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{p.displayName}{me ? ' (you)' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
