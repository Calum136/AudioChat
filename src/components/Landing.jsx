import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import AuthForm from './AuthForm';
import ConfirmDialog from './ConfirmDialog';
import FriendsPanel from './FriendsPanel';

const THEME_ACCENTS = {
  'gaming-den': '#7c5cbf',
  'scifi-lounge': '#4ecdc4',
  'fantasy-tavern': '#e8a838',
  'retro-arcade': '#e85d75',
};

const THEME_LABELS = {
  'gaming-den': 'Gaming Den',
  'scifi-lounge': 'Sci-Fi',
  'fantasy-tavern': 'Tavern',
  'retro-arcade': 'Arcade',
};

const THEME_EMOJI = {
  'gaming-den': '\u2694',
  'scifi-lounge': '\u269B',
  'fantasy-tavern': '\u2615',
  'retro-arcade': '\u25B6',
};

function RoomCard({ room, onEnter, onRequestDelete, index }) {
  const [copied, setCopied] = useState(false);
  const accent = THEME_ACCENTS[room.theme] || THEME_ACCENTS['gaming-den'];
  const label = THEME_LABELS[room.theme] || 'Room';
  const emoji = THEME_EMOJI[room.theme] || '\u2694';

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      className="room-tile"
      style={{ '--tile-accent': accent, animationDelay: `${index * 60}ms` }}
      onClick={() => onEnter(room)}
    >
      <div className="room-tile-theme-icon">{emoji}</div>
      <span className="room-tile-name">{room.name}</span>
      <div className="room-tile-footer">
        <span className="room-tile-label">{label}</span>
        <span
          className={`room-tile-code ${copied ? 'copied' : ''}`}
          onClick={handleCopyCode}
          title="Click to copy code"
        >
          {copied ? 'Copied!' : room.join_code}
        </span>
      </div>
      <button
        className="room-tile-delete"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(room);
        }}
        title="Delete room"
      >
        {'\u00D7'}
      </button>
    </button>
  );
}

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const rejoinRoom = useRoomStore((s) => s.rejoinRoom);
  const deleteRoom = useRoomStore((s) => s.deleteRoom);
  const loadMyRooms = useRoomStore((s) => s.loadMyRooms);
  const myRooms = useRoomStore((s) => s.myRooms);
  const myRoomsLoading = useRoomStore((s) => s.myRoomsLoading);

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('create');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (user) {
      loadMyRooms(user.id);
    }
  }, [user, loadMyRooms]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setError('');
    setBusy(true);
    try {
      await createRoom(roomName.trim(), user);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError('');
    setBusy(true);
    try {
      await joinRoom(joinCode.trim(), user);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleRejoin = async (room) => {
    setError('');
    setBusy(true);
    try {
      await rejoinRoom(room, user);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoom(deleteTarget.id, user.id);
    } catch (e) {
      setError(e.message);
    }
    setDeleteTarget(null);
  };

  // Unauthenticated: hero + auth form
  if (!user) {
    return (
      <div className="landing">
        <div className="landing-bg">
          <div className="aurora aurora-1" />
          <div className="aurora aurora-2" />
          <div className="aurora aurora-3" />
        </div>
        <div className="landing-content">
          <div className="landing-hero fade-up">
            <h1 className="landing-title">Sidequest</h1>
            <p className="landing-tagline">
              The place your party hangs out between matches.
            </p>
          </div>
          <div className="fade-up" style={{ animationDelay: '100ms' }}>
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: dashboard with friends sidebar
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>
      <div className="dash-layout">
        <div className="dashboard">
          {/* Compact header */}
          <header className="dash-header fade-up">
            <h1 className="dash-title">Sidequest</h1>
            <div className="dash-user">
              <div className="user-pip" style={{ background: user.color }} />
              <span className="user-name">{user.displayName}</span>
              <button className="sign-out-btn" onClick={signOut}>Log out</button>
            </div>
          </header>

          {/* Quick actions bar */}
          <div className="quick-bar fade-up" style={{ animationDelay: '80ms' }}>
            <div className="quick-tabs">
              <button
                className={`quick-tab ${mode === 'create' ? 'active' : ''}`}
                onClick={() => setMode('create')}
              >
                + New Room
              </button>
              <button
                className={`quick-tab ${mode === 'join' ? 'active' : ''}`}
                onClick={() => setMode('join')}
              >
                Join Room
              </button>
            </div>
            <div className="quick-action">
              {mode === 'create' ? (
                <div className="action-row">
                  <input
                    type="text"
                    className="quick-input"
                    placeholder="Name your room..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={30}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <button
                    className="action-btn"
                    onClick={handleCreate}
                    disabled={busy || !roomName.trim()}
                  >
                    {busy ? <div className="loading-spinner tiny" /> : 'Create'}
                  </button>
                </div>
              ) : (
                <div className="action-row">
                  <input
                    type="text"
                    className="quick-input join-code-input"
                    placeholder="Enter code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={8}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  />
                  <button
                    className="action-btn"
                    onClick={handleJoin}
                    disabled={busy || !joinCode.trim()}
                  >
                    {busy ? <div className="loading-spinner tiny" /> : 'Join'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <div className="dash-error fade-up">{error}</div>}

          {/* Rooms grid */}
          <div className="rooms-section fade-up" style={{ animationDelay: '160ms' }}>
            {myRoomsLoading ? (
              <div className="rooms-loading">
                <div className="loading-spinner small" />
              </div>
            ) : myRooms.length > 0 ? (
              <div className="room-grid">
                {myRooms.map((room, i) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={i}
                    onEnter={handleRejoin}
                    onRequestDelete={setDeleteTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="rooms-empty fade-up">
                <div className="empty-icon">~</div>
                <p>No rooms yet</p>
                <span>Create a room above to get started</span>
              </div>
            )}
          </div>
        </div>

        {/* Friends sidebar */}
        <div className="dash-friends fade-up" style={{ animationDelay: '240ms' }}>
          <FriendsPanel />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This room and all its furniture will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
