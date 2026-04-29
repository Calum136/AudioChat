import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';
import ConfirmDialog from './ConfirmDialog';
import FriendsPanel from './FriendsPanel';
import SettingsPage from './SettingsPage';
import Icon from './Icon';
import { Aurora, StatusPill, PixelAvatar, I } from './design';

// ========== Theme metadata ==========

const THEME_META = {
  'gaming-den':     { label: 'Gaming Den',     accent: '#7c5cbf', floor: '#2a1d48', floorAlt: '#3a2a5e', wall: '#1a1230' },
  'scifi-lounge':   { label: 'Sci-Fi Lounge',  accent: '#4ecdc4', floor: '#0f2830', floorAlt: '#143a45', wall: '#0a1e28' },
  'fantasy-tavern': { label: 'Fantasy Tavern', accent: '#e8a838', floor: '#3a2618', floorAlt: '#4a321f', wall: '#2a1a10' },
  'retro-arcade':   { label: 'Retro Arcade',   accent: '#e85d75', floor: '#2a0e1f', floorAlt: '#3a1528', wall: '#1a0612' },
};

function getTheme(key) {
  return THEME_META[key] || THEME_META['gaming-den'];
}

// Color shading helper (from Claude Design bundle).
function shade(hex, amt) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

// ========== Legacy pixel-art preview (kept for real-data rooms) ==========

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

// ========== Iso-style room thumbnail (Claude Design) ==========

function RoomPreview({ themeKey, imageUrl, size = 80 }) {
  const t = getTheme(themeKey);
  if (imageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(145deg, ${shade(t.wall, 6)}, ${shade(t.floor, -8)})`,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          transform: 'translate(-50%,-50%)',
          width: size * 0.7,
          height: size * 0.35,
          background: `linear-gradient(${t.floor}, ${t.floorAlt})`,
          clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '42%',
          top: '35%',
          width: size * 0.22,
          height: size * 0.3,
          background: `linear-gradient(180deg, ${t.accent}, ${shade(t.accent, -20)})`,
          borderRadius: 2,
          boxShadow: `0 0 16px ${t.accent}55`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(60% 60% at 50% 60%, ${t.accent}33, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ========== Redesigned room card ==========

function LobbyRoomCard({ room, onEnter, onRequestDelete, onRequestLeave, userId, activeCount, index }) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const theme = getTheme(room.theme);
  const isOwner = room.owner_id === userId;
  const live = activeCount > 0;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div
      className="fade-up"
      role="button"
      tabIndex={0}
      onClick={() => onEnter(room)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter(room)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: 16,
        display: 'flex',
        gap: 16,
        background: hover ? 'rgba(26,26,48,0.8)' : 'rgba(19,19,34,0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${hover ? 'rgba(232,168,56,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        transition: 'all 180ms ease',
        cursor: 'pointer',
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Accent stripe on hover */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: hover
            ? `radial-gradient(260px 160px at 80% 0%, ${theme.accent}18, transparent 70%)`
            : 'transparent',
          transition: 'opacity 220ms',
          opacity: hover ? 1 : 0,
        }}
      />

      <RoomPreview themeKey={room.theme} imageUrl={room.image_url} size={80} />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="title-md" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {room.name}
          </div>
          {live && <StatusPill kind="live" label="Live" />}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <I.users s={12} /> {activeCount} {activeCount === 1 ? 'here' : 'here'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--text-muted)' }}>{theme.label}</span>
          {!isOwner && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>Joined</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleCopy}
            title="Click to copy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: copied ? '#6fe4a8' : 'var(--text-secondary)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'color 140ms, border-color 140ms',
            }}
          >
            {copied ? <I.check s={11} /> : <I.copy s={11} />}
            <span>{copied ? 'Copied' : room.join_code}</span>
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="gold-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEnter(room);
            }}
            style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Enter <I.arrow s={12} />
          </button>
        </div>
      </div>

      {/* Dismiss (delete / leave) — only visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          isOwner ? onRequestDelete(room) : onRequestLeave(room);
        }}
        title={isOwner ? 'Delete room' : 'Leave room'}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'rgba(12,12,24,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-muted)',
          fontSize: 14,
          lineHeight: 1,
          cursor: 'pointer',
          opacity: hover ? 1 : 0,
          transition: 'opacity 140ms, color 140ms, border-color 140ms',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#e85d75';
          e.currentTarget.style.borderColor = 'rgba(232,93,117,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        }}
      >
        ×
      </button>
    </div>
  );
}

// ========== Emberstore (Out of Order) ==========

function CoinIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <defs>
        <linearGradient id="coin-g-landing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2d78a" />
          <stop offset="100%" stopColor="#c88a20" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#coin-g-landing)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      <path d="M6 5 L10 5 L8 11 Z" fill="rgba(60,30,0,0.5)" />
    </svg>
  );
}

function StoreCard({ item }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: 'rgba(12,12,24,0.65)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: 0.85,
      }}
    >
      <div
        style={{
          height: 92,
          borderRadius: 8,
          background: `linear-gradient(145deg, ${shade(item.tint, -30)}, rgba(12,12,24,0.6))`,
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '58%',
            transform: 'translate(-50%,-50%)',
            width: 70,
            height: 34,
            background: `linear-gradient(${item.tint}, ${shade(item.tint, -20)})`,
            clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
            filter: `drop-shadow(0 0 14px ${item.tint}55)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '44%',
            top: '34%',
            width: 18,
            height: 26,
            background: `linear-gradient(180deg, ${item.tint}, ${shade(item.tint, -30)})`,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            background: 'rgba(0,0,0,0.4)',
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          {item.kind.toUpperCase()}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color:
              item.rarity === 'Legendary'
                ? '#f2d78a'
                : item.rarity === 'Epic'
                ? '#c4a6f5'
                : 'var(--text-muted)',
          }}
        >
          {item.rarity.toUpperCase()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CoinIcon size={11} />
          <span className="mono" style={{ fontSize: 11, color: '#f2d78a', fontWeight: 700 }}>
            {item.price}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmberstoreStrip() {
  const items = [
    { kind: 'Furniture', name: 'Velvet Booth',   price: 420, tint: '#7c5cbf', rarity: 'Rare' },
    { kind: 'Outfit',    name: 'Fireside Cloak', price: 680, tint: '#e8a838', rarity: 'Epic' },
    { kind: 'Furniture', name: 'Holo Arcade',    price: 950, tint: '#4ecdc4', rarity: 'Legendary' },
    { kind: 'Emote',     name: 'Slow Clap',      price: 120, tint: '#e85d75', rarity: 'Common' },
  ];

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="title-lg">Emberstore</div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(232,93,117,0.14)',
              color: '#f2a4b0',
              border: '1px solid rgba(232,93,117,0.35)',
            }}
          >
            Out of order
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CoinIcon size={14} />
            <span className="mono" style={{ color: '#f2d78a', fontWeight: 700 }}>0</span>
            <span style={{ color: 'var(--text-muted)' }}>embers</span>
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(19,19,34,0.7), rgba(12,12,24,0.5))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: 16,
          overflow: 'hidden',
        }}
      >
        {/* scanlines */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 3,
            background:
              'repeating-linear-gradient(135deg, rgba(232,93,117,0.05) 0 12px, transparent 12px 28px)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 3,
            background: 'linear-gradient(180deg, rgba(6,6,16,0.35), rgba(6,6,16,0.55))',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.5,
            background:
              'radial-gradient(40% 80% at 20% 0%, rgba(232,168,56,0.1), transparent 70%),' +
              'radial-gradient(40% 80% at 80% 100%, rgba(124,92,191,0.12), transparent 70%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            filter: 'grayscale(0.25)',
          }}
        >
          {items.map((it) => (
            <StoreCard key={it.name} item={it} />
          ))}
        </div>

        {/* overlay banner */}
        <div
          style={{
            position: 'absolute',
            zIndex: 4,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(-2deg)',
            padding: '10px 22px',
            background: 'rgba(12,12,24,0.88)',
            border: '1px solid rgba(232,93,117,0.45)',
            borderRadius: 10,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 40px rgba(232,93,117,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 'calc(100% - 40px)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(232,93,117,0.14)',
              border: '1px solid rgba(232,93,117,0.4)',
              color: '#f2a4b0',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fce3a8' }}>
              Emberstore is closed for restock.
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Furniture, outfits &amp; emotes drop soon. We&rsquo;ll ping you.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Lobby header ==========

function LobbyHeader({ user, onSignOut, onOpenSettings }) {
  const displayName = user.displayName || user.email?.split('@')[0] || 'Adventurer';

  return (
    <div
      className="lobby-header-new"
      style={{
        flexShrink: 0,
        height: 64,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: 'rgba(15,15,28,0.97)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        position: 'relative',
        zIndex: 3,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="./logo.png" alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
        <span className="title-md" style={{ fontSize: 16, letterSpacing: '-0.01em' }}>
          Sidequest
        </span>
      </div>

      {/* Nav placeholder tabs removed until Rooms/Library/Friends pages exist. */}

      <div style={{ flex: 1 }} />

      {/* User chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 12px 5px 5px',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <PixelAvatar name={displayName} size={28} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{displayName}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Online</div>
        </div>
      </div>

      {/* Buy me a coffee */}
      <a
        className="bmc-btn"
        href="https://buymeacoffee.com/maritimehomebuyer"
        target="_blank"
        rel="noopener noreferrer"
        title="Buy me a coffee"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M7 22h10a1 1 0 001-1v-3H6v3a1 1 0 001 1zM18 4H6a2 2 0 00-2 2v8a4 4 0 004 4h8a4 4 0 004-4h1a3 3 0 003-3V7a3 3 0 00-3-3zm3 7a1 1 0 01-1 1h-1V6h1a1 1 0 011 1v4z" />
        </svg>
        Support
      </a>

      {/* Icon buttons */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 140ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
        }}
      >
        <I.settings s={14} />
      </button>
      <button
        onClick={onSignOut}
        title="Sign out"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 140ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
        }}
      >
        <I.leave s={14} />
      </button>
    </div>
  );
}

// ========== Splash logo (kept for unauthenticated view) ==========

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

// ========== Main Landing component ==========

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const createRoom = useRoomStore((s) => s.createRoom);
  const setOnboardingActive = useRoomStore((s) => s.setOnboardingActive);
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
    if (user) loadMyRooms(user.id);
  }, [user, loadMyRooms]);

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
    // Launch the onboarding wizard instead of creating immediately.
    // The wizard collects theme + name and calls createRoom when ready.
    // The name typed in the quick-bar (if any) carries over via the store,
    // but for simplicity we just pre-fill the wizard by resetting and letting
    // the user confirm / change the name. Nothing to pre-seed here yet.
    setError('');
    setOnboardingActive(true, { prefillName: roomName.trim() });
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

  // ========== Unauthenticated splash (Claude Design AuthScreen) ==========
  if (!user) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'var(--bg-deep)',
        }}
      >
        <Aurora level="bold" />

        {/* Floating star-field */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent 50%),' +
              'radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.3), transparent 50%),' +
              'radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.4), transparent 50%),' +
              'radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.3), transparent 50%),' +
              'radial-gradient(1px 1px at 10% 70%, rgba(255,255,255,0.4), transparent 50%),' +
              'radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.3), transparent 50%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Top brand bar */}
        <div
          className="auth-brand-bar"
          style={{
            position: 'absolute',
            top: 24,
            left: 32,
            right: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="./logo.png" alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span className="title-md" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
              Sidequest
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 22,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <a
              href="https://buymeacoffee.com/maritimehomebuyer"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              Support
            </a>
          </div>
        </div>

        {/* Centered auth card */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            padding: 20,
          }}
        >
          <AuthForm />
        </div>

        {/* Footer hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          No room code? Ask a friend to share one.
        </div>
      </div>
    );
  }

  // ========== Authenticated lobby (redesigned to match Claude Design) ==========
  const displayName = user.displayName || user.email?.split('@')[0] || 'Adventurer';
  const liveCount = Object.values(roomCounts).filter((c) => c > 0).length;
  // Rotating splash line — Minecraft-style, one picked per mount.
  const splash = useMemo(() => {
    const lines = [
      "The fire's warm.",
      'Pull up a chair.',
      'Your party missed you.',
      'Voice check.',
      'Dice are rolling somewhere.',
      'Snacks in the kitchen.',
      'Log in, log off, log on.',
      'Lanterns are lit.',
      'Someone saved you a seat.',
      'The couch remembers.',
      'No host, just vibes.',
      'Feet up, mic open.',
      'Still the coziest lounge on the internet.',
      'Bring your own playlist.',
      'Quest board is empty, thankfully.',
      'The loot is friendship.',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Aurora level="whisper" />

      <LobbyHeader user={user} onSignOut={signOut} onOpenSettings={() => setShowSettings(true)} />

      {/* Main grid: content + friends sidebar */}
      <div
        className="lobby-main-grid"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          minHeight: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Center column */}
        <div style={{ padding: '28px 32px 40px', overflow: 'auto' }}>
          {/* Greeting — rotating splash line per load */}
          <div className="fade-up" style={{ marginBottom: 18 }}>
            <div className="title-xl" style={{ fontSize: 30, marginBottom: 4 }}>
              Welcome back, <span style={{ color: 'var(--gold)' }}>{displayName}</span>.{' '}
              {splash}
            </div>
            {liveCount > 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {liveCount} of your rooms {liveCount === 1 ? 'is' : 'are'} live right now.
              </div>
            )}
          </div>

          {/* Quick create / join bar */}
          <div
            className="lobby-quick-bar fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr auto auto',
              gap: 10,
              background: 'rgba(12,12,24,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--r-lg)',
              padding: 10,
              marginBottom: 24,
              animationDelay: '60ms',
            }}
          >
            {/* Create slot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'rgba(232,168,56,0.06)',
                border: '1px dashed rgba(232,168,56,0.3)',
                borderRadius: 10,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'rgba(232,168,56,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f2d78a',
                  flexShrink: 0,
                }}
              >
                <I.plus s={14} />
              </span>
              <input
                ref={roomNameInputRef}
                type="text"
                placeholder="Name your new room…"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 500,
                  minWidth: 0,
                }}
              />
            </div>

            <button
              className="gold-btn"
              onClick={handleCreate}
              disabled={busyCreate || !roomName.trim()}
              style={{ padding: '0 18px', fontSize: 13 }}
            >
              {busyCreate ? '…' : 'Create'}
            </button>

            {/* Join slot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                minWidth: 0,
              }}
            >
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <I.link s={14} />
              </span>
              <input
                ref={joinCodeInputRef}
                type="text"
                placeholder="Paste join code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  minWidth: 0,
                }}
              />
              <button
                className="ghost-btn"
                onClick={handleJoin}
                disabled={busyJoin || !joinCode.trim()}
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                {busyJoin ? '…' : 'Join'}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="fade-up"
              style={{
                padding: '10px 14px',
                marginBottom: 18,
                background: 'rgba(232,93,117,0.08)',
                border: '1px solid rgba(232,93,117,0.25)',
                borderRadius: 'var(--r-sm)',
                color: '#f2a4b0',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* My Rooms */}
          <div
            className="fade-up"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
              animationDelay: '120ms',
            }}
          >
            <div className="title-lg">My Rooms</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {myRooms.length} {myRooms.length === 1 ? 'room' : 'rooms'}
              {liveCount > 0 && ` · ${liveCount} live`}
            </div>
          </div>

          {myRoomsLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              Loading your rooms…
            </div>
          ) : myRooms.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}
            >
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
            <div
              className="fade-up"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'rgba(12,12,24,0.4)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div className="title-md" style={{ marginBottom: 8 }}>
                No rooms yet
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
                Create a room or join one to start your sidequest.
              </div>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <button className="gold-btn" onClick={() => roomNameInputRef.current?.focus()}>
                  New Room
                </button>
                <button className="ghost-btn" onClick={() => joinCodeInputRef.current?.focus()}>
                  Join a Room
                </button>
              </div>
            </div>
          )}

          {/* Emberstore */}
          <EmberstoreStrip />
        </div>

        {/* Right sidebar: Friends (existing FriendsPanel retained) */}
        <div
          className="lobby-friends-rail"
          style={{
            background: 'rgba(15,15,28,0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
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
