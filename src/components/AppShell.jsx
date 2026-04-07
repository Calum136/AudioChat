import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useVoiceStore } from '../stores/voiceStore';
import { useVoiceConnection } from '../hooks/useVoiceConnection';
import Icon from './Icon';
import Room from './Room';
import Palette from './Palette';
import SocialPanel from './SocialPanel';
import ThemePicker from './ThemePicker';
import MusicPlayer from './MusicPlayer';

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const roomName = useRoomStore((s) => s.roomName);
  const joinCode = useRoomStore((s) => s.joinCode);
  const ownerId = useRoomStore((s) => s.ownerId);
  const isEditing = useRoomStore((s) => s.isEditing);
  const toggleEditing = useRoomStore((s) => s.toggleEditing);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const participants = useRoomStore((s) => s.participants);

  const knockRequests = useRoomStore((s) => s.knockRequests);
  const dismissKnock = useRoomStore((s) => s.dismissKnock);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const isMuted = useVoiceStore((s) => s.isMuted);
  const toggleMute = useVoiceStore((s) => s.toggleMute);

  useVoiceConnection();

  const participantCount = Object.keys(participants).length;
  const isOwner = user && ownerId === user.id;
  const me = user ? participants[user.id] : null;
  const seatType = me?.seatFurnitureId ? (me?.seatType || 'sit') : null;
  const isListenOrAfk = seatType === 'listen' || seatType === 'afk';
  const isDeafened = useVoiceStore((s) => s.isDeafened);
  const connectionError = useVoiceStore((s) => s.connectionError);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={leaveRoom}>
            <Icon name="arrowLeft" size={16} />
            <span>Leave</span>
          </button>
          <div className="room-info">
            <h1 className="room-title">{roomName}</h1>
            <span className="room-meta">
              {participantCount} here
              {joinCode && (
                <span className="join-code" title="Share this code to invite friends">
                  {joinCode}
                </span>
              )}
              {connectionState === 'connected' && (
                <span className="voice-badge">Voice</span>
              )}
              {connectionState === 'connecting' && (
                <span className="voice-badge connecting">Connecting...</span>
              )}
              {connectionError && connectionState === 'disconnected' && (
                <span className="voice-badge error" title={connectionError}>Voice Error</span>
              )}
            </span>
          </div>
        </div>
        <div className="header-right">
          {connectionState === 'connected' && (
            <>
              <button
                className={`voice-btn ${isMuted ? 'muted' : ''} ${isListenOrAfk ? 'locked' : ''}`}
                onClick={isListenOrAfk ? undefined : toggleMute}
                title={isListenOrAfk ? `Mic locked (${seatType === 'afk' ? 'AFK' : 'listen-only'} seat)` : isMuted ? 'Unmute' : 'Mute'}
                disabled={isListenOrAfk}
              >
                <Icon name={isMuted ? 'micOff' : 'mic'} size={16} />
              </button>
              {isDeafened && (
                <span className="voice-badge afk">AFK</span>
              )}
              {seatType === 'listen' && (
                <span className="voice-badge listen">Listen Only</span>
              )}
            </>
          )}
          <MusicPlayer />
          {isOwner && <ThemePicker />}
          {isOwner && (
            <button
              className={`edit-btn ${isEditing ? 'active' : ''}`}
              onClick={toggleEditing}
            >
              {isEditing ? (
                <><Icon name="check" size={16} /> Done</>
              ) : (
                <><Icon name="edit" size={16} /> Edit Room</>
              )}
            </button>
          )}
        </div>
      </header>
      {/* Knock notifications */}
      {knockRequests.length > 0 && (
        <div className="knock-bar">
          {knockRequests.map((k) => (
            <div key={k.userId} className="knock-toast">
              <div className="knock-avatar" style={{ background: k.color }}>{k.displayName[0]}</div>
              <span className="knock-text"><strong>{k.displayName}</strong> is knocking to join</span>
              <span className="knock-code">Share code: <strong>{joinCode}</strong></span>
              <button className="knock-dismiss" onClick={() => dismissKnock(k.userId)}>&times;</button>
            </div>
          ))}
        </div>
      )}
      <div className="app-body">
        {isOwner && <Palette />}
        <Room />
        <SocialPanel />
      </div>
    </div>
  );
}
