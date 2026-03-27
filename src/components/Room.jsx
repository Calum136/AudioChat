import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { THEMES } from '../data/themes';
import { FURNITURE_CATALOG } from '../data/furniture';
import { FLOOR_TILES } from '../data/sprites/floorSprites';
import { WALL_SPRITES, WALL_H, HALF_TILE, TILE_HALF_H } from '../data/sprites/wallSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';
import { isoToScreen, screenToIso, snapToGrid, isInBounds, getDepth, TILE_W, TILE_H } from '../lib/isoGrid';
import { useAuthStore } from '../stores/authStore';
import FurnitureItem from './FurnitureItem';
import StandingAvatar from './StandingAvatar';

const ROOM_GRID_W = 8;
const ROOM_GRID_H = 8;

export default function Room() {
  const furniture = useRoomStore((s) => s.furniture);
  const theme = useRoomStore((s) => s.theme);
  const isEditing = useRoomStore((s) => s.isEditing);
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const participants = useRoomStore((s) => s.participants);
  const moveAvatar = useRoomStore((s) => s.moveAvatar);
  const selectedType = useRoomStore((s) => s.selectedFurnitureType);
  const setSelectedType = useRoomStore((s) => s.setSelectedFurnitureType);
  const user = useAuthStore((s) => s.user);
  const flipFurniture = useRoomStore((s) => s.flipFurniture);
  const roomRef = useRef(null);
  const themeData = THEMES[theme];
  const [zoom, setZoom] = useState(1);

  // Auto-fit zoom: scale room to fit the viewport on mount and resize
  useEffect(() => {
    const calcFitZoom = () => {
      const container = roomRef.current;
      if (!container) return;
      const totalW = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_W / 2);
      const totalH = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_H / 2) + TILE_H + WALL_H;
      const pad = 40; // breathing room
      const fitW = (container.clientWidth - pad) / totalW;
      const fitH = (container.clientHeight - pad) / totalH;
      const fit = Math.min(fitW, fitH, 2);
      setZoom(Math.max(0.4, Math.round(fit * 20) / 20)); // snap to 0.05 increments
    };
    calcFitZoom();
    window.addEventListener('resize', calcFitZoom);
    return () => window.removeEventListener('resize', calcFitZoom);
  }, []);

  // Zoom handler (mouse wheel)
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.4, z + (e.deltaY > 0 ? -0.1 : 0.1))));
    }
  }, []);

  // Generate floor tile image for current theme
  const floorTileUrl = useMemo(() => {
    const tile = FLOOR_TILES[theme];
    if (!tile) return null;
    return renderPixelGrid(tile.grid, tile.palette, 1);
  }, [theme]);

  // Generate wall images for current theme (single sprite per wall face)
  const wallData = useMemo(() => {
    const sprites = WALL_SPRITES[theme];
    if (!sprites) return null;
    return {
      left: {
        url: renderPixelGrid(sprites.left.grid, sprites.left.palette, 1),
        width: sprites.left.width,
        height: sprites.left.height,
      },
      right: {
        url: renderPixelGrid(sprites.right.grid, sprites.right.palette, 1),
        width: sprites.right.width,
        height: sprites.right.height,
      },
      corner: {
        url: renderPixelGrid(sprites.corner.grid, sprites.corner.palette, 1),
        width: sprites.corner.width,
        height: sprites.corner.height,
      },
    };
  }, [theme]);

  // Calculate room origin — shifted down to make room for walls above
  const roomPixelWidth = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_W / 2);
  const roomPixelHeight = (ROOM_GRID_W + ROOM_GRID_H) * (TILE_H / 2);
  const originX = ROOM_GRID_H * (TILE_W / 2);
  const originY = WALL_H; // push floor down so walls render above

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

  // Light map: accumulate light from emitting furniture onto floor tiles
  const lightMap = useMemo(() => {
    const map = new Map(); // key: "gx,gy" -> { color, opacity }
    for (const f of furniture) {
      const cat = FURNITURE_CATALOG[f.type];
      if (!cat || !cat.light) continue;
      const { radius, color } = cat.light;
      for (let gx = 0; gx < ROOM_GRID_W; gx++) {
        for (let gy = 0; gy < ROOM_GRID_H; gy++) {
          const dist = Math.abs(gx - f.x) + Math.abs(gy - f.y);
          if (dist <= radius) {
            const falloff = 1 - dist / (radius + 1);
            const key = `${gx},${gy}`;
            const existing = map.get(key);
            if (existing) {
              existing.opacity = Math.min(1, existing.opacity + falloff * 0.8);
            } else {
              map.set(key, { color, opacity: falloff * 0.8 });
            }
          }
        }
      }
    }
    return map;
  }, [furniture]);

  // Place furniture at grid coords (shared by drag-drop and click-to-place)
  const placeFurnitureAt = useCallback((type, screenX, screenY) => {
    if (!type || !FURNITURE_CATALOG[type]) return false;

    const floorEl = roomRef.current?.querySelector('.iso-floor');
    if (!floorEl) return false;
    const rect = floorEl.getBoundingClientRect();
    const sx = (screenX - rect.left) / zoom;
    const sy = (screenY - rect.top) / zoom;

    const raw = screenToIso(sx, sy, originX, originY);
    const { gx, gy } = snapToGrid(raw.gx, raw.gy);

    const cat = FURNITURE_CATALOG[type];
    if (!isInBounds(gx, gy, ROOM_GRID_W, ROOM_GRID_H)) return false;
    if (gx + cat.tileW > ROOM_GRID_W || gy + cat.tileH > ROOM_GRID_H) return false;

    for (let dx = 0; dx < cat.tileW; dx++) {
      for (let dy = 0; dy < cat.tileH; dy++) {
        if (occupiedCells.has(`${gx + dx},${gy + dy}`)) return false;
      }
    }

    addFurniture(type, gx, gy);
    return true;
  }, [addFurniture, originX, originY, occupiedCells, zoom]);

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
    placeFurnitureAt(type, e.clientX, e.clientY);
  }, [isEditing, placeFurnitureAt]);

  // Click handler: furniture placement (edit mode) or avatar movement (normal mode)
  const handleClick = useCallback((e) => {
    // In edit mode with selected furniture type: place it
    if (isEditing && selectedType) {
      if (placeFurnitureAt(selectedType, e.clientX, e.clientY)) {
        setSelectedType(null);
      }
      return;
    }

    // Not in edit mode: move avatar to clicked grid cell
    if (!isEditing && user) {
      const floorEl = roomRef.current?.querySelector('.iso-floor');
      if (!floorEl) return;
      const rect = floorEl.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / zoom;
      const sy = (e.clientY - rect.top) / zoom;
      const raw = screenToIso(sx, sy, originX, originY);
      const { gx, gy } = snapToGrid(raw.gx, raw.gy);
      if (isInBounds(gx, gy, ROOM_GRID_W, ROOM_GRID_H)) {
        moveAvatar(user.id, gx, gy);
      }
    }
  }, [isEditing, selectedType, placeFurnitureAt, setSelectedType, user, moveAvatar, originX, originY, zoom]);

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
        <span className="stat-dot">&middot;</span>
        <span className="zoom-controls">
          <button className="zoom-btn" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>−</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={() => setZoom((z) => Math.min(2, z + 0.15))}>+</button>
          {zoom !== 1 && <button className="zoom-btn" onClick={() => setZoom(1)}>Reset</button>}
        </span>
      </div>
      <div
        ref={roomRef}
        className={`room-view ${isEditing ? 'editing' : ''} ${selectedType ? 'placing' : ''}`}
        style={{ background: themeData.roomBg }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onWheel={handleWheel}
      >
        {/* Isometric room with pixel art walls */}
        <div
          className="iso-floor"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            width: roomPixelWidth,
            height: roomPixelHeight + TILE_H + WALL_H,
            position: 'relative',
          }}
        >
          {/* Left wall — single continuous sprite along gy=0 edge */}
          {wallData && (() => {
            const { x, y } = isoToScreen(0, 0, originX, originY);
            return (
              <img
                src={wallData.left.url}
                className="wall-tile"
                style={{
                  position: 'absolute',
                  left: x,
                  top: y - WALL_H,
                  width: wallData.left.width,
                  height: wallData.left.height,
                  zIndex: 0,
                }}
                draggable={false}
                alt=""
              />
            );
          })()}

          {/* Right wall — single continuous sprite along gx=0 edge */}
          {wallData && (() => {
            const { x, y } = isoToScreen(0, 0, originX, originY);
            return (
              <img
                src={wallData.right.url}
                className="wall-tile"
                style={{
                  position: 'absolute',
                  left: x - wallData.right.width,
                  top: y - WALL_H,
                  width: wallData.right.width,
                  height: wallData.right.height,
                  zIndex: 0,
                }}
                draggable={false}
                alt=""
              />
            );
          })()}

          {/* Corner column where walls meet */}
          {wallData && (() => {
            const { x, y } = isoToScreen(0, 0, originX, originY);
            return (
              <img
                src={wallData.corner.url}
                className="wall-tile"
                style={{
                  position: 'absolute',
                  left: x - wallData.corner.width / 2,
                  top: y - WALL_H,
                  width: wallData.corner.width,
                  height: wallData.corner.height,
                  zIndex: 0,
                }}
                draggable={false}
                alt=""
              />
            );
          })()}

          {/* Floor tiles */}
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

          {/* Lighting overlay — glow from light-emitting furniture */}
          {floorTiles.map(({ gx, gy, x, y }) => {
            const light = lightMap.get(`${gx},${gy}`);
            if (!light) return null;
            return (
              <div
                key={`light-${gx}-${gy}`}
                className="light-overlay"
                style={{
                  position: 'absolute',
                  left: x - TILE_W / 2,
                  top: y,
                  width: TILE_W,
                  height: TILE_H,
                  background: `radial-gradient(ellipse at 50% 50%, ${light.color} 0%, transparent 70%)`,
                  opacity: light.opacity,
                }}
              />
            );
          })}

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
              flipped={item.flipped}
              originX={originX}
              originY={originY}
              zoom={zoom}
            />
          ))}

          {/* Standing avatars for non-seated participants */}
          {Object.values(participants).map((p) => {
            // Skip participants who are sitting (they render via SeatMarker)
            if (p.seatFurnitureId) return null;
            // Skip if no grid position
            if (p.gridX == null || p.gridY == null) return null;
            const { x, y } = isoToScreen(p.gridX, p.gridY, originX, originY);
            const depth = getDepth(p.gridX, p.gridY);
            return (
              <StandingAvatar
                key={`avatar-${p.id}`}
                participant={p}
                screenX={x}
                screenY={y + TILE_H / 2}
                depth={depth}
              />
            );
          })}
        </div>

        {isEditing && furniture.length === 0 && (
          <div className="room-empty">Drag furniture here from the palette</div>
        )}
      </div>
    </div>
  );
}
