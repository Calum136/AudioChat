import { useRef, useMemo, useCallback } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { THEMES } from '../data/themes';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FLOOR_TILES } from '../data/sprites/floorSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { isoToScreen, screenToIso, snapToGrid, isInBounds, TILE_W, TILE_H } from '../lib/isoGrid';
import FurnitureItem from './FurnitureItem';

const ROOM_GRID_W = 8;
const ROOM_GRID_H = 8;

export default function Room() {
  const furniture = useRoomStore((s) => s.furniture);
  const theme = useRoomStore((s) => s.theme);
  const isEditing = useRoomStore((s) => s.isEditing);
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const roomRef = useRef(null);
  const themeData = THEMES[theme];

  // Generate floor tile image for current theme
  const floorTileUrl = useMemo(() => {
    const tile = FLOOR_TILES[theme];
    if (!tile) return null;
    return renderPixelGrid(tile.grid, tile.palette, 1);
  }, [theme]);

  // Calculate room origin (center-top of the isometric diamond)
  const roomPixelWidth = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_W / 2);
  const roomPixelHeight = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_H / 2);
  const originX = ROOM_GRID_H * (TILE_W / 2); // offset so (0,0) is top-left of diamond
  const originY = 0;

  // Generate floor tile positions
  const floorTiles = useMemo(() => {
    const tiles = [];
    for (let gx = 0; gx < ROOM_GRID_W; gx++) {
      for (let gy = 0; gy < ROOM_GRID_H; gy++) {
        const { x, y } = isoToScreen(gx, gy, originX, originY);
        tiles.push({ gx, gy, x, y });
      }
    }
    return tiles;
  }, [originX, originY]);

  // Build occupied cell set for collision detection
  const occupiedCells = useMemo(() => {
    const set = new Set();
    for (const f of furniture) {
      const cat = FURNITURE_CATALOG[f.type];
      if (!cat) continue;
      for (let dx = 0; dx < cat.tileW; dx++) {
        for (let dy = 0; dy < cat.tileH; dy++) {
          set.add(`${f.x + dx},${f.y + dy}`);
        }
      }
    }
    return set;
  }, [furniture]);

  // Drop handler: convert screen coords to grid coords
  const handleDragOver = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, [isEditing]);

  const handleDrop = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type');
    if (!type || !FURNITURE_CATALOG[type]) return;

    const rect = roomRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Convert screen to grid
    const raw = screenToIso(sx, sy, originX, originY);
    const { gx, gy } = snapToGrid(raw.gx, raw.gy);

    // Validate in bounds
    const cat = FURNITURE_CATALOG[type];
    if (!isInBounds(gx, gy, ROOM_GRID_W, ROOM_GRID_H)) return;
    if (gx + cat.tileW > ROOM_GRID_W || gy + cat.tileH > ROOM_GRID_H) return;

    // Check collision
    for (let dx = 0; dx < cat.tileW; dx++) {
      for (let dy = 0; dy < cat.tileH; dy++) {
        if (occupiedCells.has(`${gx + dx},${gy + dy}`)) return;
      }
    }

    addFurniture(type, gx, gy);
  }, [isEditing, addFurniture, originX, originY, occupiedCells]);

  // Sort furniture by depth for correct overlapping
  const sortedFurniture = useMemo(() => {
    return [...furniture].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  }, [furniture]);

  const totalSeats = furniture.reduce((sum, f) => {
    const cat = FURNITURE_CATALOG[f.type];
    return sum + (cat ? cat.seats.length : 0);
  }, 0);

  return (
    <div className="room-container">
      <div className="room-stats">
        <span>{furniture.length} items</span>
        <span className="stat-dot">&middot;</span>
        <span>{totalSeats} seats</span>
      </div>
      <div
        ref={roomRef}
        className={`room-view ${isEditing ? 'editing' : ''}`}
        style={{ background: themeData.roomBg }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Isometric floor grid */}
        <div
          className="iso-floor"
          style={{
            width: roomPixelWidth,
            height: roomPixelHeight + TILE_H,
            position: 'relative',
          }}
        >
          {floorTiles.map(({ gx, gy, x, y }) => (
            <img
              key={`${gx}-${gy}`}
              src={floorTileUrl}
              className="floor-tile"
              style={{
                position: 'absolute',
                left: x - TILE_W / 2,
                top: y,
                width: TILE_W,
                height: TILE_H,
              }}
              draggable={false}
              alt=""
            />
          ))}

          {/* Edit mode: hover grid overlay */}
          {isEditing && floorTiles.map(({ gx, gy, x, y }) => {
            const isOccupied = occupiedCells.has(`${gx},${gy}`);
            return (
              <div
                key={`grid-${gx}-${gy}`}
                className={`grid-cell ${isOccupied ? 'occupied' : 'available'}`}
                style={{
                  position: 'absolute',
                  left: x - TILE_W / 2,
                  top: y,
                  width: TILE_W,
                  height: TILE_H,
                }}
              />
            );
          })}

          {/* Furniture items — depth sorted */}
          {sortedFurniture.map((item) => (
            <FurnitureItem
              key={item.id}
              id={item.id}
              type={item.type}
              gridX={item.x}
              gridY={item.y}
              originX={originX}
              originY={originY}
            />
          ))}
        </div>

        {isEditing && furniture.length === 0 && (
          <div className="room-empty">Drag furniture here from the palette</div>
        )}
      </div>
    </div>
  );
}
