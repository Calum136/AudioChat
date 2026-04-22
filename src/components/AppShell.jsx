import { useState } from 'react';
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
import SettingsPage from './SettingsPage';
import EditRoomModal from './EditRoomModal';
import { Aurora, StatusPill, InitialAvatar, I } from './design';

// Map real room.theme keys to accent colours for the top-bar dot + ambient halo.
const THEME_ACCENTS = {
  'gaming-den':     { accent: '#7c5cbf', label: 'Gaming Den' },
  'scifi-lounge':   { accent: '#4ecdc4', label: 'Sci-Fi Lounge' },
  'fantasy-tavern': { accent: '#e8a838', label: 'Fantasy Tavern' },
  'retro-arcade':   { accent: '#e85d75', label: 'Retro Arcade' },
};

// Rounded icon button used in the top glass bar.
function TopIconBtn({ onClick, title, children, active, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="room-top-icon-btn"
      style={{
        background: active ? 'rgba(232,168,56,0.14)' : 'rgba(255,255,255,0.03)',
        borderColor: active ? 'rgba(232,168,56,0.35)' : 'rgba(255,255,255,0.07)',
        color: active ? '#f2d78a' : 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  );
}

// Pill button used in the floating bottom control bar.
function CtrlBtn({ children, active, danger, onClick, title, disabled }) {
  const bg = danger
    ? 'rgba(232,93,117,0.15)'
    : active
    ? 'rgba(232,168,56,0.14)'
    : 'rgba(255,255,255,0.03)';
  const bd = danger
    ? 'rgba(232,93,117,0.35)'
    : active
    ? 'rgba(232,168,56,0.35)'
    : 'rgba(255,255,255,0.06)';
  const c = danger ? '#f2a4b0' : active ? '#f2d78a' : 'var(--text-secondary)';
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border: `1px solid ${bd}`,
        color: c,
        transition: 'all 160ms ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function AppShell() {
  const [showSettings, setShowSettings] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const user = useAuthStore((s) => s.user);
  const roomName = useRoomStore((s) => s.roomName);
  const joinCode = useRoomStore((s) => s.joinCode);
  const ownerId = useRoomStore((s) => s.ownerId);
  const theme = useRoomStore((s) => s.theme);
  const isEditing = useRoomStore((s) => s.isEditing);
  const toggleEditing = useRoomStore((s) => s.toggleEditing);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const participants = useRoomStore((s) => s.participants);

  const isAdmin = useRoomStore((s) => s.isAdmin);
  const knockRequests = useRoomStore((s) => s.knockRequests);
  const dismissKnock = useRoomStore((s) => s.dismissKnock);
  const sendInvite = useRoomStore((s) => s.sendInvite);
  const connectionState = useVoiceStore((s) => s.connectionState);
  const connectionError = useVoiceStore((s) => s.connectionError);
  const isMuted = useVoiceStore((s) => s.isMuted);
  const toggleMute = useVoiceStore((s) => s.toggleMute);
  const isDeafened = useVoiceStore((s) => s.isDeafened);
  const setDeafened = useVoiceStore((s) => s.setDeafened);

  useVoiceConnection();

  const participantList = Object.values(participants);
  const participantCount = participantList.length;
  const isOwner = user && ownerId === user.id;
  const canEdit = isOwner || isAdmin;
  const me = user ? participants[user.id] : null;
  const seatType = me?.seatFurnitureId ? me?.seatType || 'sit' : null;
  const isListenOrAfk = seatType === 'listen' || seatType === 'afk';
  const themeMeta = THEME_ACCENTS[theme] || THEME_ACCENTS['gaming-den'];
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1200);
    });
  };

  return (
    <div
      className="app-shell room-shell"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(80% 60% at 50% 30%, ${themeMeta.accent}15, var(--bg-base) 70%), var(--bg-deep)`,
      }}
    >
      <Aurora level="whisper" />

      {/* ==================== TOP GLASS BAR ==================== */}
      <div
        className="room-top-bar"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 14px',
          background: 'rgba(12,12,24,0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-md)',
          zIndex: 10,
        }}
      >
        {/* Leave -> back to lobby */}
        <button
          onClick={leaveRoom}
          className="ghost-btn"
          style={{
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
        >
          <span style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
            <I.arrow s={12} />
          </span>
          Lobby
        </button>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)' }} />

        {/* Room title + theme label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: themeMeta.accent,
              boxShadow: `0 0 10px ${themeMeta.accent}`,
              flexShrink: 0,
            }}
          />
          <div
            className="title-md"
            style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {roomName || 'Room'}
          </div>
          {isOwner && (
            <button
              onClick={() => setShowEditRoom(true)}
              title="Room settings"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="edit" size={12} />
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            · {themeMeta.label}
          </span>
        </div>

        {participantCount > 0 && (
          <StatusPill
            kind="live"
            label={`${participantCount} ${participantCount === 1 ? 'here' : 'here'}`}
          />
        )}

        {/* Voice state badge */}
        {connectionState === 'connecting' && (
          <span
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(144,144,176,0.1)',
              border: '1px solid rgba(144,144,176,0.25)',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Connecting…
          </span>
        )}
        {connectionError && connectionState === 'disconnected' && (
          <span
            title={connectionError}
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(232,93,117,0.1)',
              border: '1px solid rgba(232,93,117,0.3)',
              color: '#f2a4b0',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Voice error
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Participant avatar stack */}
        {participantCount > 0 && (
          <div style={{ display: 'flex' }} className="room-top-stack">
            {participantList.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                title={p.displayName}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid var(--bg-base)',
                  marginLeft: i === 0 ? 0 : -8,
                  overflow: 'hidden',
                  background: p.color || '#2a1a3a',
                  zIndex: 10 - i,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <InitialAvatar name={p.displayName || '?'} size={24} tint={p.color} />
              </div>
            ))}
            {participantCount > 4 && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid var(--bg-base)',
                  marginLeft: -8,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                +{participantCount - 4}
              </div>
            )}
          </div>
        )}

        {/* Join code (click to copy) */}
        {joinCode && (
          <button
            onClick={handleCopyCode}
            title="Click to copy"
            className="mono room-top-code"
            style={{
              fontSize: 11,
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              color: copiedCode ? '#6fe4a8' : 'var(--text-secondary)',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 140ms',
            }}
          >
            {copiedCode ? <I.check s={11} /> : <I.copy s={11} />}
            {copiedCode ? 'Copied' : joinCode}
          </button>
        )}

        <MusicPlayer />

        {/* Edit toggle (owner/admin) */}
        {canEdit && (
          <button
            onClick={toggleEditing}
            className="ghost-btn"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isEditing ? 'rgba(232,168,56,0.14)' : undefined,
              borderColor: isEditing ? 'rgba(232,168,56,0.4)' : undefined,
              color: isEditing ? '#f2d78a' : undefined,
            }}
          >
            {isEditing ? <I.check s={12} /> : <I.furniture s={12} />}
            {isEditing ? 'Done' : 'Edit'}
          </button>
        )}

        {canEdit && isEditing && <ThemePicker />}

        <TopIconBtn onClick={() => setShowSettings(true)} title="Settings">
          <I.settings s={14} />
        </TopIconBtn>

        <button
          onClick={leaveRoom}
          title="Leave room"
          style={{
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(232,93,117,0.1)',
            border: '1px solid rgba(232,93,117,0.3)',
            color: '#f2a4b0',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(232,93,117,0.18)';
            e.currentTarget.style.borderColor = 'rgba(232,93,117,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(232,93,117,0.1)';
            e.currentTarget.style.borderColor = 'rgba(232,93,117,0.3)';
          }}
        >
          <I.leave s={12} /> Leave
        </button>
      </div>

      {/* ==================== KNOCK NOTIFICATIONS ==================== */}
      {knockRequests.length > 0 && (
        <div
          className="knock-bar"
          style={{
            position: 'absolute',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {knockRequests.map((k) => (
            <div key={k.userId} className="knock-toast">
              <div className="knock-avatar" style={{ background: k.color }}>
                {k.displayName[0]}
              </div>
              <span className="knock-text">
                <strong>{k.displayName}</strong> is knocking
              </span>
              <button
                className="knock-accept"
                onClick={() => {
                  sendInvite(k.userId, joinCode);
                  dismissKnock(k.userId);
                }}
              >
                Let In
              </button>
              <button className="knock-dismiss" onClick={() => dismissKnock(k.userId)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ==================== LEFT RAIL — furniture palette (edit mode) ==================== */}
      {canEdit && isEditing && (
        <div
          className="room-left-rail"
          style={{
            position: 'absolute',
            top: 76,
            bottom: 80,
            left: 12,
            width: 240,
            background: 'rgba(12,12,24,0.58)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          <Palette />
        </div>
      )}

      {/* ==================== RIGHT RAIL — participants / friends ==================== */}
      <div
        className="room-right-rail"
        style={{
          position: 'absolute',
          top: 76,
          bottom: 80,
          right: 12,
          width: 260,
          background: 'rgba(12,12,24,0.5)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        <SocialPanel />
      </div>

      {/* ==================== ROOM CENTER ==================== */}
      <div
        className="room-center"
        style={{
          position: 'absolute',
          top: 76,
          bottom: 80,
          left: canEdit && isEditing ? 264 : 12,
          right: 284,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <Room />

        {canEdit && isEditing && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              padding: '6px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              background: 'rgba(232,168,56,0.12)',
              border: '1px solid rgba(232,168,56,0.35)',
              color: '#f2d78a',
              borderRadius: 6,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            Edit mode · owner/admin
          </div>
        )}
      </div>

      {/* ==================== BOTTOM CONTROL BAR ==================== */}
      {connectionState === 'connected' && (
        <div
          className="room-control-bar"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            padding: 8,
            background: 'rgba(12,12,24,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          <CtrlBtn
            active={!isMuted}
            danger={isMuted}
            disabled={isListenOrAfk}
            onClick={isListenOrAfk ? undefined : toggleMute}
            title={
              isListenOrAfk
                ? `Mic locked (${seatType === 'afk' ? 'AFK' : 'listen-only'} seat)`
                : isMuted
                ? 'Unmute'
                : 'Mute'
            }
          >
            {isMuted ? <I.micOff s={16} /> : <I.mic s={16} />}
          </CtrlBtn>

          <CtrlBtn
            active={!isDeafened}
            danger={isDeafened}
            onClick={() => setDeafened(!isDeafened)}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <I.headphones s={16} />
          </CtrlBtn>

          {/* Listen/AFK seat indicator */}
          {seatType === 'listen' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 12px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#9ce8e0',
                background: 'rgba(78,205,196,0.1)',
                border: '1px solid rgba(78,205,196,0.3)',
                borderRadius: 999,
              }}
            >
              Listen only
            </div>
          )}
          {seatType === 'afk' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 12px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                background: 'rgba(144,144,176,0.1)',
                border: '1px solid rgba(144,144,176,0.25)',
                borderRadius: 999,
              }}
            >
              AFK
            </div>
          )}

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 4px' }} />

          <CtrlBtn onClick={() => setShowSettings(true)} title="Settings">
            <I.settings s={16} />
          </CtrlBtn>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 4px' }} />

          <button
            onClick={leaveRoom}
            title="Leave room"
            style={{
              padding: '0 18px',
              borderRadius: 999,
              background: 'rgba(232,93,117,0.15)',
              border: '1px solid rgba(232,93,117,0.35)',
              color: '#f2a4b0',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 160ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(232,93,117,0.22)';
              e.currentTarget.style.borderColor = 'rgba(232,93,117,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(232,93,117,0.15)';
              e.currentTarget.style.borderColor = 'rgba(232,93,117,0.35)';
            }}
          >
            <I.leave s={13} /> Leave
          </button>
        </div>
      )}

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
      {showEditRoom && <EditRoomModal onClose={() => setShowEditRoom(false)} />}
    </div>
  );
}
