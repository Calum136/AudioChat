import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';
import ConfirmDialog from './ConfirmDialog';
import FriendsPanel from './FriendsPanel';
import SettingsPage from './SettingsPage';
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

// Simple pixel art room preview thumbnails (16x12 grids)
const THEME_PREVIEWS = {
  'gaming-den': {
    grid: [
      '................',
      '.33333333333333.',
      '.34444444444443.',
      '.34555454554543.',
      '.34444444444443.',
      '.34444444444443.',
      '.34444444444443.',
      '.34446664444443.',
      '.34446764444443.',
      '.34446664444443.',
      '.33333333333333.',
      '................',
    ],
    palette: ['transparent', '#1a1020', '#2a1a30', '#221828', '#2a1a30', '#362040', '#7c5cbf', '#9b7aba'],
  },
  'scifi-lounge': {
    grid: [
      '................',
      '.33333333333333.',
      '.34444544444443.',
      '.34444444544443.',
      '.34544444444543.',
      '.34444444444443.',
      '.34444664444443.',
      '.34444674444443.',
      '.34444664444443.',
      '.34444444444443.',
      '.33333333333333.',
      '................',
    ],
    palette: ['transparent', '#0a1828', '#1a2838', '#0e1420', '#0e1e30', '#1a4a6a', '#4ecdc4', '#70e8e0'],
  },
  'fantasy-tavern': {
    grid: [
      '................',
      '.33333333333333.',
      '.34444444444443.',
      '.34555444555443.',
      '.34444444444443.',
      '.34444444444443.',
      '.34444664444443.',
      '.34446774644443.',
      '.34444664444443.',
      '.34444444444443.',
      '.33333333333333.',
      '................',
    ],
    palette: ['transparent', '#1a0e06', '#2a1e10', '#1a1008', '#3a2510', '#4a3520', '#e8a838', '#ffc848'],
  },
  'retro-arcade': {
    grid: [
      '................',
      '.33333333333333.',
      '.34454344543443.',
      '.34343454343543.',
      '.34454344543443.',
      '.34343454343543.',
      '.34444664444443.',
      '.34446764444443.',
      '.34444664444443.',
      '.34454344543443.',
      '.33333333333333.',
      '................',
    ],
    palette: ['transparent', '#0a0414', '#1a0828', '#0e0618', '#1a0e28', '#301848', '#e85d75', '#ff7a90'],
  },
};

// Render a tiny room preview to canvas data URL
const previewCache = {};
function getRoomPreview(theme) {
  if (previewCache[theme]) return previewCache[theme];
  const preview = THEME_PREVIEWS[theme] || THEME_PREVIEWS['gaming-den'];
  const rows = preview.grid;
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = parseInt(rows[y][x], 16);
      if (idx > 0 && preview.palette[idx]) {
        ctx.fillStyle = preview.palette[idx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const url = canvas.toDataURL();
  previewCache[theme] = url;
  return url;
}

function LobbyRoomCard({ room, onEnter, onRequestDelete, onRequestLeave, userId, index, activeCount }) {
  const [copied, setCopied] = useState(false);
  const accent = THEME_ACCENTS[room.theme] || THEME_ACCENTS['gaming-den'];
  const label = THEME_LABELS[room.theme] || 'Room';
  const isOwner = room.owner_id === userId;

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="lobby-room-card"
      style={{ '--tile-accent': accent, animationDelay: `${index * 60}ms` }}
      onClick={() => onEnter(room)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEnter(room)}
    >
      <img
        className={`lobby-card-preview${room.image_url ? ' lobby-card-cover' : ''}`}
        src={room.image_url || getRoomPreview(room.theme)}
        alt={label}
      />
      <div className="lobby-card-body">
        <div className="lobby-card-meta">
          <span className="lobby-card-label">{label}</span>
          {activeCount > 0 && (
            <span className="lobby-card-active">● {activeCount}</span>
          )}
        </div>
        <span className="lobby-card-name">{room.name}</span>
        <div className="lobby-card-footer">
          <span
            className={`lobby-card-code ${copied ? 'copied' : ''}`}
            onClick={handleCopyCode}
            title="Click to copy code"
          >
            {copied ? 'Copied!' : room.join_code}
          </span>
          <button
            className="lobby-card-enter"
            onClick={(e) => { e.stopPropagation(); onEnter(room); }}
          >
            Enter →
          </button>
        </div>
      </div>
      <button
        className="lobby-card-dismiss"
        onClick={(e) => {
          e.stopPropagation();
          isOwner ? onRequestDelete(room) : onRequestLeave(room);
        }}
        title={isOwner ? 'Delete room' : 'Leave room'}
      >
        ×
      </button>
    </div>
  );
}

function QuestLogo({ size = 'large' }) {
  return (
    <div className={`quest-logo ${size}`}>
      <div className="quest-teardrop">
        <span className="quest-bang">!</span>
      </div>
      <div className="quest-dot" />
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
  const leaveRoomMembership = useRoomStore((s) => s.leaveRoomMembership);
  const loadMyRooms = useRoomStore((s) => s.loadMyRooms);
  const myRooms = useRoomStore((s) => s.myRooms);
  const myRoomsLoading = useRoomStore((s) => s.myRoomsLoading);

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyJoin, setBusyJoin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [roomCounts, setRoomCounts] = useState({});
  const presenceChannelsRef = useRef([]);
  const roomNameInputRef = useRef(null);
  const joinCodeInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadMyRooms(user.id);
    }
  }, [user, loadMyRooms]);

  // Subscribe to each room's presence channel to track active player counts
  useEffect(() => {
    const channels = presenceChannelsRef.current;
    channels.forEach((ch) => supabase.removeChannel(ch));
    presenceChannelsRef.current = [];

    if (!myRooms.length) return;

    const newChannels = myRooms.map((room) => {
      const ch = supabase.channel(`lobby:${room.id}`, { config: { presence: { key: '' } } });
      ch.on('presence', { event: 'sync' }, () => {
        const count = Object.keys(ch.presenceState()).length;
        setRoomCounts((prev) => ({ ...prev, [room.id]: count }));
      });
      ch.subscribe();
      return ch;
    });
    presenceChannelsRef.current = newChannels;

    return () => {
      newChannels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [myRooms]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setError('');
    setBusyCreate(true);
    try {
      await createRoom(roomName.trim(), user);
    } catch (e) {
      setError(e.message);
    }
    setBusyCreate(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError('');
    setBusyJoin(true);
    try {
      await joinRoom(joinCode.trim(), user);
    } catch (e) {
      setError(e.message);
    }
    setBusyJoin(false);
  };

  const handleRejoin = async (room) => {
    setError('');
    try {
      await rejoinRoom(room, user);
    } catch (e) {
      setError(e.message);
    }
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

  const handleConfirmLeave = async () => {
    if (!leaveTarget) return;
    try {
      await leaveRoomMembership(leaveTarget.id, user.id);
    } catch (e) {
      setError(e.message);
    }
    setLeaveTarget(null);
  };

  // Unauthenticated: splash + auth form
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
            <QuestLogo size="hero" />
            <h1 className="landing-title splash-title">Sidequest</h1>
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

  // Authenticated: lobby
  return (
    <div className="landing landing-dashboard">
      <div className="landing-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>
      <div className="dash-layout">
        <div className="dashboard">
          {/* Lobby header — glass panel with brand row + actions row */}
          <header className="lobby-header fade-up">
            <div className="lobby-header-top">
              <div className="lobby-brand">
                <img src="/logo.png" alt="Sidequest" className="brand-logo-img" />
                <h1 className="lobby-title">Sidequest</h1>
              </div>
              <div className="lobby-user">
                <div className="user-pip" style={{ background: user.color }} />
                <span className="user-name">{user.displayName}</span>
                <a
                  className="bmc-btn"
                  href="https://buymeacoffee.com/maritimehomebuyer"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buy me a coffee"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 22h10a1 1 0 001-1v-3H6v3a1 1 0 001 1zM18 4H6a2 2 0 00-2 2v8a4 4 0 004 4h8a4 4 0 004-4h1a3 3 0 003-3V7a3 3 0 00-3-3zm3 7a1 1 0 01-1 1h-1V6h1a1 1 0 011 1v4z"/></svg>
                  Support
                </a>
                <button className="lobby-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
                  <Icon name="settings" size={14} />
                </button>
                <button className="lobby-icon-btn" onClick={signOut} title="Log out">
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>

            <div className="lobby-header-divider" />

            <div className="lobby-actions">
              <div className="lobby-create-row">
                <input
                  ref={roomNameInputRef}
                  type="text"
                  className="lobby-input"
                  placeholder="Name your room..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  className="lobby-btn lobby-btn-create"
                  onClick={handleCreate}
                  disabled={busyCreate || !roomName.trim()}
                >
                  {busyCreate ? <div className="loading-spinner tiny" /> : '+ Create'}
                </button>
              </div>
              <div className="lobby-join-row">
                <input
                  ref={joinCodeInputRef}
                  type="text"
                  className="lobby-input lobby-input-code"
                  placeholder="Enter code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={8}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  className="lobby-btn lobby-btn-join"
                  onClick={handleJoin}
                  disabled={busyJoin || !joinCode.trim()}
                >
                  {busyJoin ? <div className="loading-spinner tiny" /> : 'Join'}
                </button>
              </div>
            </div>
          </header>

          {error && <div className="dash-error fade-up">{error}</div>}

          {/* Rooms area */}
          <div className="lobby-rooms-area fade-up" style={{ animationDelay: '120ms' }}>
            <div className="lobby-section-header">
              <span className="lobby-section-label">My Rooms</span>
              {myRooms.length > 0 && (
                <span className="lobby-section-count">{myRooms.length}</span>
              )}
            </div>
            {myRoomsLoading ? (
              <div className="rooms-loading">
                <div className="loading-spinner small" />
              </div>
            ) : myRooms.length > 0 ? (
              <div className="lobby-room-grid">
                {myRooms.map((room, i) => (
                  <LobbyRoomCard
                    key={room.id}
                    room={room}
                    index={i}
                    userId={user.id}
                    onEnter={handleRejoin}
                    onRequestDelete={setDeleteTarget}
                    onRequestLeave={setLeaveTarget}
                    activeCount={roomCounts[room.id] || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="lobby-empty fade-up">
                <QuestLogo size="medium" />
                <p>No rooms yet</p>
                <span>Create a room or join one to start your sidequest</span>
                <div className="lobby-empty-actions">
                  <button
                    className="lobby-empty-btn"
                    onClick={() => roomNameInputRef.current?.focus()}
                  >
                    New Room
                  </button>
                  <button
                    className="lobby-empty-btn lobby-empty-btn-secondary"
                    onClick={() => joinCodeInputRef.current?.focus()}
                  >
                    Join a Room
                  </button>
                </div>
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

      <ConfirmDialog
        open={!!leaveTarget}
        title={`Leave "${leaveTarget?.name}"?`}
        message="This room will be removed from your list. You can rejoin with the code."
        confirmLabel="Leave"
        variant="danger"
        onConfirm={handleConfirmLeave}
        onCancel={() => setLeaveTarget(null)}
      />

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}
