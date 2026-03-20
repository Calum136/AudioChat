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

function RoomCard({ room, onEnter, index }) {
  const accent = THEME_ACCENTS[room.theme] || THEME_ACCENTS['gaming-den'];
  return (
    <button
      className={`room-card${index === 0 ? ' room-card-hero' : ''}`}
      style={{ '--card-accent': accent, animationDelay: `${index * 80}ms` }}
      onClick={() => onEnter(room)}
    >
      <div className="room-card-accent" />
      <div className="room-card-body">
        <span className="room-card-name">{room.name}</span>
        <span className="room-card-code">{room.join_code}</span>
      </div>
      <Icon name="arrowRight" size={16} className="room-card-arrow" />
    </button>
  );
}

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const rejoinRoom = useRoomStore((s) => s.rejoinRoom);
  const loadMyRooms = useRoomStore((s) => s.loadMyRooms);
  const myRooms = useRoomStore((s) => s.myRooms);
  const myRoomsLoading = useRoomStore((s) => s.myRoomsLoading);

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load user's rooms when logged in
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

  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>
      <div className="landing-content">
        <div className="landing-hero fade-up" style={{ animationDelay: '0ms' }}>
          <div className="landing-badge">Early Prototype</div>
          <h1 className="landing-title">Sidequest</h1>
          <p className="landing-tagline">
            The place your party hangs out between matches.
          </p>
        </div>

        {!user ? (
          <div className="fade-up" style={{ animationDelay: '100ms' }}>
            <p className="landing-desc">
              Sign in or create an account to start building your hangout room.
            </p>
            <AuthForm />
          </div>
        ) : (
          <div className="landing-authenticated fade-up" style={{ animationDelay: '100ms' }}>
            <div className="user-greeting glass-panel">
              <div className="user-avatar-lg" style={{ background: user.color }}>
                {user.displayName[0]}
              </div>
              <span>Hey, <strong>{user.displayName}</strong></span>
              <button className="sign-out-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>

            {/* My Rooms */}
            {myRoomsLoading ? (
              <div className="my-rooms-loading">
                <div className="loading-spinner small" />
                <span>Loading your rooms...</span>
              </div>
            ) : myRooms.length > 0 ? (
              <div className="my-rooms-section fade-up" style={{ animationDelay: '200ms' }}>
                <h3 className="section-heading">
                  <Icon name="furniture" size={16} />
                  Your Rooms
                </h3>
                <div className="room-card-grid">
                  {myRooms.map((room, i) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      index={i}
                      onEnter={handleRejoin}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Create / Join */}
            <div className="room-actions-row fade-up" style={{ animationDelay: '300ms' }}>
              <div className="room-action-card glass-panel">
                <h3 className="action-label">
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
              </div>

              <div className="room-action-card glass-panel">
                <h3 className="action-label">
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
              </div>
            </div>

            {error && <div className="auth-error fade-up">{error}</div>}
          </div>
        )}

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
