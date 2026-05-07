/**
 * Dev-only demo room — renders the 3D scene with hardcoded furniture, no auth.
 * Access via #demo in the URL.
 */
import { useEffect, useState } from 'react';
import { useRoomStore } from '../stores/roomStore';
import RoomScene3D from './three/RoomScene3D';

// Positions chosen to be valid across all 4 theme shapes:
//   gaming-den (8x8 full), fantasy-tavern (10x8 full),
//   scifi-lounge (10x8 ellipse), retro-arcade (9x9 cross gx=3-5 + gy=3-5)
const DEMO_FURNITURE = [
  { id: 'f1', type: 'couch',       x: 3, y: 6, flipped: false },
  { id: 'f2', type: 'beanbag',     x: 5, y: 5, flipped: false },
  { id: 'f3', type: 'gamingchair', x: 3, y: 4, flipped: false },
  { id: 'f4', type: 'table',       x: 4, y: 4, flipped: false },
  { id: 'f5', type: 'lamp',        x: 5, y: 3, flipped: false },
  { id: 'f6', type: 'plant',       x: 3, y: 3, flipped: false },
  { id: 'f7', type: 'arcade',      x: 4, y: 1, flipped: false },
  { id: 'f8', type: 'tv',          x: 5, y: 6, flipped: false },
  { id: 'f9', type: 'barcounter',  x: 3, y: 7, flipped: false },
];

const THEMES = ['gaming-den', 'scifi-lounge', 'fantasy-tavern', 'retro-arcade'];

export default function DemoRoom() {
  const [theme, setThemeLocal] = useState(
    window.location.hash.replace('#demo/', '') || 'gaming-den'
  );
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    useRoomStore.setState({
      view: 'room',
      roomId: 'demo-room',
      roomName: 'Demo Room',
      theme,
      isEditing: editing,
      furniture: DEMO_FURNITURE,
      participants: {},
      isOwner: true,
      canEdit: true,
    });
  }, [theme, editing]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d0d18' }}>
      {/* Scene — fills the entire viewport */}
      <RoomScene3D theme={theme} zoom={zoom} onFloorClick={() => {}} />

      {/* Floating controls */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, display: 'flex', gap: 6, pointerEvents: 'all',
      }}>
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => {
              window.history.replaceState({}, '', `#demo/${t}`);
              setThemeLocal(t);
            }}
            style={{
              padding: '4px 10px', fontSize: 11, cursor: 'pointer',
              background: theme === t ? '#d4af37' : 'rgba(0,0,0,0.6)',
              color: theme === t ? '#000' : '#fff',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
            }}
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => setEditing((e) => !e)}
          style={{
            padding: '4px 10px', fontSize: 11, cursor: 'pointer',
            background: editing ? 'rgba(255,80,80,0.35)' : 'rgba(0,0,0,0.6)',
            color: editing ? '#ff8080' : '#aaa',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
          }}
        >
          {editing ? 'Editing ON' : 'Edit Mode'}
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4 }}
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4 }}
        >−</button>
      </div>
    </div>
  );
}
