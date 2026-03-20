import { useState, useMemo, useCallback } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FURNITURE_SPRITES } from '../data/sprites/furnitureSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { isoToScreen, screenToIso, snapToGrid, isInBounds, getDepth, TILE_W, TILE_H } from '../lib/isoGrid';
import SeatMarker from './SeatMarker';

const ROOM_GRID_W = 8;
const ROOM_GRID_H = 8;
const SPRITE_SCALE = 3; // Scale up pixel art 3x for visibility

export default function FurnitureItem({ id, type, gridX, gridY, originX, originY }) {
  const isEditing = useRoomStore((s) => s.isEditing);
  const moveFurniture = useRoomStore((s) => s.moveFurniture);
  const removeFurniture = useRoomStore((s) => s.removeFurniture);
  const catalog = FURNITURE_CATALOG[type];
  const spriteData = FURNITURE_SPRITES[type];
  const [dragging, setDragging] = useState(false);

  if (!catalog || !spriteData) return null;

  // Render sprite to data URL
  const spriteUrl = useMemo(() => {
    return renderPixelGrid(spriteData.grid, spriteData.palette, SPRITE_SCALE);
  }, [spriteData]);

  // Sprite display dimensions
  const spriteW = spriteData.grid[0].length * SPRITE_SCALE;
  const spriteH = spriteData.grid.length * SPRITE_SCALE;

  // Convert grid position to screen position
  const { x: screenX, y: screenY } = isoToScreen(gridX, gridY, originX, originY);

  // For multi-tile items, calculate center point
  const centerOffset = isoToScreen(
    gridX + catalog.tileW / 2,
    gridY + catalog.tileH / 2,
    originX,
    originY
  );

  // Position sprite: center horizontally on tile, bottom-align to tile base
  const spriteLeft = centerOffset.x - spriteW / 2;
  const spriteTop = centerOffset.y + TILE_H / 2 - spriteH;

  const depth = getDepth(gridX, gridY);

  // Drag to move (in edit mode)
  const handleMouseDown = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const handleMouseMove = (moveE) => {
      // Get room element bounds
      const roomEl = e.target.closest('.iso-floor');
      if (!roomEl) return;
      const rect = roomEl.getBoundingClientRect();
      const sx = moveE.clientX - rect.left;
      const sy = moveE.clientY - rect.top;

      const raw = screenToIso(sx, sy, originX, originY);
      const { gx, gy } = snapToGrid(raw.gx, raw.gy);

      if (isInBounds(gx, gy, ROOM_GRID_W, ROOM_GRID_H) &&
          gx + catalog.tileW <= ROOM_GRID_W &&
          gy + catalog.tileH <= ROOM_GRID_H) {
        if (gx !== gridX || gy !== gridY) {
          moveFurniture(id, gx, gy);
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, id, gridX, gridY, originX, originY, moveFurniture, catalog.tileW, catalog.tileH]);

  return (
    <div
      className={`furniture-item ${isEditing ? 'editable' : ''} ${dragging ? 'dragging' : ''} ${catalog.seats.length > 0 ? 'has-seats' : 'decor'}`}
      style={{
        position: 'absolute',
        left: spriteLeft,
        top: spriteTop,
        width: spriteW,
        height: spriteH,
        zIndex: depth + (dragging ? 1000 : 0),
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={spriteUrl}
        className="furniture-sprite"
        style={{ width: spriteW, height: spriteH }}
        draggable={false}
        alt={catalog.name}
      />
      {catalog.seats.map((seat, i) => (
        <SeatMarker
          key={i}
          furnitureId={id}
          seatIndex={i}
          seat={seat}
          furnitureScreenX={centerOffset.x}
          furnitureScreenY={centerOffset.y}
        />
      ))}
      {isEditing && (
        <button
          className="furniture-remove"
          onClick={(e) => {
            e.stopPropagation();
            removeFurniture(id);
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
