import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import Icon from './Icon';

export default function FriendPanel() {
  const friends = useRoomStore((s) => s.friends);
  const furniture = useRoomStore((s) => s.furniture);
  const standUp = useRoomStore((s) => s.standUp);
  const speakingMap = useVoiceStore((s) => s.speakingMap);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const isMuted = useVoiceStore((s) => s.isMuted);

  const seated = friends.filter((f) => f.seatFurnitureId && f.online);
  const standing = friends.filter((f) => !f.seatFurnitureId && f.online);
  const offline = friends.filter((f) => !f.online);

  const getSeatLabel = (friend) => {
    const furn = furniture.find((f) => f.id === friend.seatFurnitureId);
    if (!furn) return '';
    const cat = FURNITURE_CATALOG[furn.type];
    return cat ? cat.name : '';
  };

  return (
    <div className="friend-panel">
      <h3 className="panel-title">
        <span className="pulse-dot" />
        In the Room
      </h3>

      {seated.length > 0 && (
        <div className="friend-section">
          {seated.map((f) => {
            const isSpeaking = connectionState === 'connected' && speakingMap[f.id];
            return (
              <div
                key={f.id}
                className={`friend-row seated ${f.isMe ? 'is-me' : ''} ${isSpeaking ? 'speaking' : ''}`}
              >
                <div className="friend-avatar" style={{ background: f.color }}>
                  {f.name[0]}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{f.name}</span>
                  <span className="friend-seat">
                    {getSeatLabel(f)}
                    {f.isMe && connectionState === 'connected' && (
                      <Icon name={isMuted ? 'micOff' : 'mic'} size={10} className="friend-mic-icon" />
                    )}
                  </span>
                </div>
                {isSpeaking && (
                  <span className="voice-indicator">
                    <Icon name="speaking" size={14} />
                  </span>
                )}
                {f.isMe && (
                  <button
                    className="stand-btn"
                    onClick={() => standUp('me')}
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
          {standing.map((f) => (
            <div
              key={f.id}
              className={`friend-row standing ${f.isMe ? 'is-me' : ''}`}
            >
              <div className="friend-avatar" style={{ background: f.color }}>
                {f.name[0]}
              </div>
              <div className="friend-info">
                <span className="friend-name">{f.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {offline.length > 0 && (
        <div className="friend-section">
          <h4 className="section-label">Offline</h4>
          {offline.map((f) => (
            <div key={f.id} className="friend-row offline">
              <div
                className="friend-avatar offline-avatar"
                style={{ background: f.color }}
              >
                {f.name[0]}
              </div>
              <div className="friend-info">
                <span className="friend-name">{f.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
