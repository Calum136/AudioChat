import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import AuthForm from './AuthForm';
import Icon from './Icon';

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-content">
        <div className="landing-badge">Early Prototype</div>
        <h1 className="landing-title">Sidequest</h1>
        <p className="landing-tagline">
          The place your party hangs out between matches.
        </p>

        {!user ? (
          <>
            <p className="landing-desc">
              Sign in or create an account to start building your hangout room.
            </p>
            <AuthForm />
          </>
        ) : (
          <div className="room-actions">
            <div className="user-greeting">
              <div className="user-avatar-lg" style={{ background: user.color }}>
                {user.displayName[0]}
              </div>
              <span>Hey, <strong>{user.displayName}</strong></span>
              <button className="sign-out-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>

            <div className="room-action-group">
              <h3 className="action-label">Create a Room</h3>
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
                  className="enter-btn small"
                  onClick={handleCreate}
                  disabled={busy || !roomName.trim()}
                >
                  Create
                  <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </div>

            <div className="room-action-divider">or</div>

            <div className="room-action-group">
              <h3 className="action-label">Join a Room</h3>
              <div className="action-row">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter join code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={8}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  className="enter-btn small"
                  onClick={handleJoin}
                  disabled={busy || !joinCode.trim()}
                >
                  Join
                  <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
          </div>
        )}

        <div className="landing-features">
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
