import { useMemo } from 'react';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FURNITURE_SPRITES } from '../data/sprites/furnitureSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { useRoomStore } from '../stores/roomStore';

const THUMB_SCALE = 2;

function PaletteCard({ type, item }) {
  const spriteData = FURNITURE_SPRITES[type];

  const thumbUrl = useMemo(() => {
    if (!spriteData) return null;
    return renderPixelGrid(spriteData.grid, spriteData.palette, THUMB_SCALE);
  }, [spriteData]);

  const thumbW = spriteData ? spriteData.grid[0].length * THUMB_SCALE : 28;
  const thumbH = spriteData ? spriteData.grid.length * THUMB_SCALE : 28;

  return (
    <div
      className="palette-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('furniture-type', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {thumbUrl ? (
        <img
          src={thumbUrl}
          className="palette-sprite"
          style={{
            width: thumbW,
            height: thumbH,
            maxWidth: 56,
            maxHeight: 48,
            objectFit: 'contain',
          }}
          draggable={false}
          alt={item.name}
        />
      ) : (
        <div style={{ width: 28, height: 28 }} />
      )}
      <span className="palette-name">{item.name}</span>
      {item.seats.length > 0 && (
        <span className="palette-seats">{item.seats.length}s</span>
      )}
    </div>
  );
}

export default function Palette() {
  const isEditing = useRoomStore((s) => s.isEditing);

  if (!isEditing) return null;

  const seating = Object.entries(FURNITURE_CATALOG).filter(
    ([, v]) => v.category === 'seating'
  );
  const decor = Object.entries(FURNITURE_CATALOG).filter(
    ([, v]) => v.category === 'decor'
  );

  return (
    <div className="palette">
      <h3 className="palette-title">Furniture</h3>

      <div className="palette-section">
        <h4>Seating</h4>
        <div className="palette-grid">
          {seating.map(([type, item]) => (
            <PaletteCard key={type} type={type} item={item} />
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h4>Decor</h4>
        <div className="palette-grid">
          {decor.map(([type, item]) => (
            <PaletteCard key={type} type={type} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
