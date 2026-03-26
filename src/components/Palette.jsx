import { useMemo } from 'react';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FURNITURE_SPRITES } from '../data/sprites/furnitureSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { useRoomStore } from '../stores/roomStore';

const THUMB_SCALE = 2;

function PaletteCard({ type, item, isSelected, onSelect }) {
  const spriteData = FURNITURE_SPRITES[type];

  const thumbUrl = useMemo(() => {
    if (!spriteData) return null;
    const grid = spriteData.frames ? spriteData.frames[0] : spriteData.grid;
    return renderPixelGrid(grid, spriteData.palette, THUMB_SCALE);
  }, [spriteData]);

  const grid = spriteData?.frames ? spriteData.frames[0] : spriteData?.grid;
  const thumbW = grid ? grid[0].length * THUMB_SCALE : 28;
  const thumbH = grid ? grid.length * THUMB_SCALE : 28;

  return (
    <div
      className={`palette-card ${isSelected ? 'selected' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('furniture-type', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onSelect(isSelected ? null : type)}
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
  const selectedType = useRoomStore((s) => s.selectedFurnitureType);
  const setSelectedType = useRoomStore((s) => s.setSelectedFurnitureType);

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
      {selectedType && (
        <div className="palette-hint">Click on the room to place {FURNITURE_CATALOG[selectedType]?.name}</div>
      )}

      <div className="palette-section">
        <h4>Seating</h4>
        <div className="palette-grid">
          {seating.map(([type, item]) => (
            <PaletteCard key={type} type={type} item={item} isSelected={selectedType === type} onSelect={setSelectedType} />
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h4>Decor</h4>
        <div className="palette-grid">
          {decor.map(([type, item]) => (
            <PaletteCard key={type} type={type} item={item} isSelected={selectedType === type} onSelect={setSelectedType} />
          ))}
        </div>
      </div>
    </div>
  );
}
