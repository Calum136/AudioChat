import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FURNITURE_SPRITES } from '../data/sprites/furnitureSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { isoToScreen, screenToIso, snapToGrid, isInBounds, getDepth, TILE_W, TILE_H } from '../lib/isoGrid';
import SeatMarker from './SeatMarker';

const ROOM_GRID_W = 8;
const ROOM_GRID_H = 8;
const SPRITE_SCALE = 3; // Scale up pixel art 3x for visibility

export default function FurnitureItem({ id, type, gridX, gridY, flipped, originX, originY, zoom }) {
  const isEditing = useRoomStore((s) => s.isEditing);
  const moveFurniture = useRoomStore((s) => s.moveFurniture);
  const removeFurniture = useRoomStore((s) => s.removeFurniture);
  const flipFurniture = useRoomStore((s) => s.flipFurniture);
  const participants = useRoomStore((s) => s.participants);
  const sitDown = useRoomStore((s) => s.sitDown);
  const standUp = useRoomStore((s) => s.standUp);
  const user = useAuthStore((s) => s.user);
  const catalog = FURNITURE_CATALOG[type];
  const spriteData = FURNITURE_SPRITES[type];
  const [dragging, setDragging] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const isAnimated = spriteData?.frames && spriteData.frames.length > 1;
  const grid = isAnimated ? spriteData.frames[frameIndex] : spriteData?.grid;

  // Animation frame cycling
  useEffect(() => {
    if (!isAnimated) return;
    const delay = catalog?.frameDelay || 600;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % spriteData.frames.length);
    }, delay);
    return () => clearInterval(interval);
  }, [isAnimated, spriteData?.frames?.length, catalog?.frameDelay]);

  if (!catalog || !spriteData || !grid) return null;

  // Render sprite to data URL
  const spriteUrl = useMemo(() => {
    return renderPixelGrid(grid, spriteData.palette, SPRITE_SCALE);
  }, [grid, spriteData.palette]);

  // Sprite display dimensions
  const spriteW = grid[0].length * SPRITE_SCALE;
  const spriteH = grid.length * SPRITE_SCALE;

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

  // Click to sit/stand on furniture with seats (non-edit mode)
  const handleClick = useCallback((e) => {
    if (isEditing || !user || catalog.seats.length === 0) return;
    e.stopPropagation(); // Prevent Room's moveAvatar

    const me = participants[user.id];

    // If I'm already on THIS furniture, stand up
    if (me?.seatFurnitureId === id) {
      standUp(user.id);
      return;
    }

    // Find first empty seat/spot
    const emptySeatIndex = catalog.seats.findIndex((_, i) => {
      return !Object.values(participants).some(
        p => p.seatFurnitureId === id && p.seatIndex === i
      );
    });

    if (emptySeatIndex < 0) return; // All spots taken

    // If sitting/standing elsewhere, leave first
    if (me?.seatFurnitureId) standUp(user.id);
    sitDown(user.id, id, emptySeatIndex);
  }, [isEditing, user, id, catalog.seats, participants, sitDown, standUp]);

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
      const z = zoom || 1;
      const sx = (moveE.clientX - rect.left) / z;
      const sy = (moveE.clientY - rect.top) / z;

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
  }, [isEditing, id, gridX, gridY, originX, originY, moveFurniture, catalog.tileW, catalog.tileH, zoom]);

  const handleContextMenu = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    flipFurniture(id);
  }, [isEditing, id, flipFurniture]);

  const hasSeats = catalog.seats.length > 0;

  return (
    <div
      className={`furniture-item ${isEditing ? 'editable' : ''} ${dragging ? 'dragging' : ''} ${hasSeats ? 'has-seats' : 'decor'}`}
      data-type={type}
      style={{
        position: 'absolute',
        left: spriteLeft,
        top: spriteTop,
        width: spriteW,
        height: spriteH,
        zIndex: depth + (dragging ? 1000 : 0),
        cursor: !isEditing && hasSeats ? 'pointer' : undefined,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <img
        src={spriteUrl}
        className="furniture-sprite"
        style={{
          width: spriteW,
          height: spriteH,
          transform: flipped ? 'scaleX(-1)' : 'none',
        }}
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
        <div className="furniture-edit-controls">
          <button
            className="furniture-flip"
            onClick={(e) => {
              e.stopPropagation();
              flipFurniture(id);
            }}
            title="Flip"
          >
            ↔
          </button>
          <button
            className="furniture-remove"
            onClick={(e) => {
              e.stopPropagation();
              removeFurniture(id);
            }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
