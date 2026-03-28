import { useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { standingAvatar, SKIN_TONES, HAIR_COLORS } from '../data/sprites/avatarSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';

const SHIRT_COLORS = [
  '#5577bb', '#4ecdc4', '#e85d75', '#e8a838',
  '#7c5cbf', '#5ce878', '#cc5533', '#3388dd',
  '#dd44aa', '#88bb44',
];

const PANTS_COLORS = [
  '#3d5288', '#2a4a6a', '#4a3a6a', '#3a5a4a',
  '#5a3a3a', '#2a2a3a', '#4a4a3a', '#3a2a4a',
  '#5a4a2a', '#2a3a5a',
];

const BG_COLORS = [
  '#1a1a2e', '#1a2a1a', '#2e1a1a', '#1a2a2e',
  '#2e2a1a', '#2a1a2e', '#0e1e30', '#1a1008',
  '#1a1020', '#0a0414',
];

function darken(hex, factor = 0.8) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function buildPalette(avatar) {
  return [
    'transparent',
    '#2a1a0e',
    avatar.skin,
    darken(avatar.skin, 0.82),
    avatar.hair,
    avatar.shirt,
    darken(avatar.shirt, 0.82),
    '#2a1a0e',
    avatar.pants,
  ];
}

function ColorPicker({ label, colors, value, onChange }) {
  return (
    <div className="avatar-picker">
      <span className="avatar-picker-label">{label}</span>
      <div className="avatar-picker-swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`avatar-swatch ${value === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AvatarEditor({ onClose }) {
  const user = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const [avatar, setAvatar] = useState(() => user?.avatar || {
    hair: '#6b4422',
    skin: '#f0c8a0',
    shirt: '#5577bb',
    pants: '#3d5288',
    bg: '#1a1a2e',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewUrl = useMemo(() => {
    const palette = buildPalette(avatar);
    return renderPixelGrid(standingAvatar.grid, palette, 6);
  }, [avatar]);

  const set = (key, val) => {
    setAvatar((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const err = await updateAvatar(avatar);
    setSaving(false);
    if (!err) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="avatar-editor">
      <div className="avatar-editor-header">
        <h3>Edit Avatar</h3>
        {onClose && (
          <button className="avatar-close" onClick={onClose}>{'\u00D7'}</button>
        )}
      </div>

      <div className="avatar-editor-body">
        <div className="avatar-preview-wrap" style={{ background: avatar.bg }}>
          <img
            className="avatar-preview-img"
            src={previewUrl}
            alt="Avatar preview"
          />
        </div>

        <div className="avatar-pickers">
          <ColorPicker label="Hair" colors={HAIR_COLORS} value={avatar.hair} onChange={(c) => set('hair', c)} />
          <ColorPicker label="Skin" colors={SKIN_TONES} value={avatar.skin} onChange={(c) => set('skin', c)} />
          <ColorPicker label="Shirt" colors={SHIRT_COLORS} value={avatar.shirt} onChange={(c) => set('shirt', c)} />
          <ColorPicker label="Pants" colors={PANTS_COLORS} value={avatar.pants} onChange={(c) => set('pants', c)} />
          <ColorPicker label="Background" colors={BG_COLORS} value={avatar.bg} onChange={(c) => set('bg', c)} />
        </div>
      </div>

      <button
        className="avatar-save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Avatar'}
      </button>
    </div>
  );
}
