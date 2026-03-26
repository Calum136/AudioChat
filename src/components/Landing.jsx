import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import AuthForm from './AuthForm';
import Icon from './Icon';

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

function RoomCard({ room, onEnter, onDelete, index }) {
  const [confirming, setConfirming] = useState(false);
  const accent = THEME_ACCENTS[room.theme] || THEME_ACCENTS['gaming-den'];
  const label = THEME_LABELS[room.theme] || 'Room';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirming) {
      onDelete(room.id);
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <div
      className="room-card"
      style={{ '--card-accent': accent, animationDelay: `${index * 80}ms` }}
    >
      <div className="room-card-accent" />
      <button className="room-card-main" onClick={() => onEnter(room)}>
        <div className="room-card-body">
          <span className="room-card-name">{room.name}</span>
          <div className="room-card-meta">
            <span className="room-card-theme">{label}</span>
            <span className="room-card-code">{room.join_code}</span>
          </div>
        </div>
        <Icon name="arrowRight" size={16} className="room-card-arrow" />
      </button>
      <button
        className={`room-card-delete ${confirming ? 'confirming' : ''}`}
        onClick={handleDelete}
        title={confirming ? 'Click again to confirm' : 'Delete room'}
      >
        {confirming ? '?' : '\u00D7'}
      </button>
    </div>
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

  const handleDelete = async (roomId) => {
    try {
      await deleteRoom(roomId, user.id);
    } catch (e) {
      setError(e.message);
    }
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
            <div className="landing-badge">Early Prototype</div>
            <h1 className="landing-title">Sidequest</h1>
            <p className="landing-tagline">
              The place your party hangs out between matches.
            </p>
          </div>
          <div className="fade-up" style={{ animationDelay: '100ms' }}>
            <p className="landing-desc">
              Sign in or create an account to start building your hangout room.
            </p>
            <AuthForm />
          </div>
          <div className="landing-features fade-up" style={{ animationDelay: '400ms' }}>
            <div className="feature">
              <Icon name="furniture" size={28} className="feature-icon" />
              <span>Furniture-based seating</span>
            </div>
            <div className="feature">
              <Icon name="palette" size={28} className="feature-icon" />
              <span>Customizable rooms</span>
            </div>
            <div className="feature">
              <Icon name="users" size={28} className="feature-icon" />
              <span>Voice chat</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: modular dashboard
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>
      <div className="dashboard">
        {/* Top bar */}
        <header className="dash-header fade-up">
          <div className="dash-brand">
            <h1 className="dash-title">Sidequest</h1>
            <span className="landing-badge">Early Prototype</span>
          </div>
          <div className="dash-user">
            <div className="user-avatar-lg" style={{ background: user.color }}>
              {user.displayName[0]}
            </div>
            <strong>{user.displayName}</strong>
            <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
          </div>
        </header>

        {/* Main grid */}
        <div className="dash-grid">
          {/* Left column: rooms list */}
          <section className="dash-panel dash-rooms fade-up" style={{ animationDelay: '100ms' }}>
            <h3 className="section-heading">
              <Icon name="furniture" size={16} />
              Your Rooms
            </h3>
            {myRoomsLoading ? (
              <div className="my-rooms-loading">
                <div className="loading-spinner small" />
                <span>Loading...</span>
              </div>
            ) : myRooms.length > 0 ? (
              <div className="room-card-list">
                {myRooms.map((room, i) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={i}
                    onEnter={handleRejoin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="dash-empty">
                <p>No rooms yet. Create one to get started!</p>
              </div>
            )}
          </section>

          {/* Right column: actions */}
          <div className="dash-actions">
            <section className="dash-panel dash-create fade-up" style={{ animationDelay: '200ms' }}>
              <h3 className="section-heading">
                <Icon name="palette" size={16} />
                Create a Room
              </h3>
              <div className="action-row">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Room name..."
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
            </section>

            <section className="dash-panel dash-join fade-up" style={{ animationDelay: '300ms' }}>
              <h3 className="section-heading">
                <Icon name="users" size={16} />
                Join a Room
              </h3>
              <div className="action-row">
                <input
                  type="text"
                  className="auth-input join-code-input"
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
            </section>

            <section className="dash-panel dash-info fade-up" style={{ animationDelay: '400ms' }}>
              <div className="dash-info-grid">
                <div className="info-stat">
                  <Icon name="furniture" size={20} className="feature-icon" />
                  <span className="info-label">Furniture-based seating</span>
                </div>
                <div className="info-stat">
                  <Icon name="palette" size={20} className="feature-icon" />
                  <span className="info-label">Customizable rooms</span>
                </div>
                <div className="info-stat">
                  <Icon name="users" size={20} className="feature-icon" />
                  <span className="info-label">Voice chat</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {error && <div className="auth-error fade-up">{error}</div>}
      </div>
    </div>
  );
}
