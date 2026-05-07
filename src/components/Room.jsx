import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { THEMES } from '../data/themes';
import { FURNITURE_CATALOG } from '../data/furniture';
import { ROOM_SHAPES, isInMask } from '../data/roomShapes';
import { useAuthStore } from '../stores/authStore';
import RoomScene3D from './three/RoomScene3D';

export default function Room() {
  const furniture = useRoomStore((s) => s.furniture);
  const theme = useRoomStore((s) => s.theme);
  const isEditing = useRoomStore((s) => s.isEditing);
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const participants = useRoomStore((s) => s.participants);
  const moveAvatar = useRoomStore((s) => s.moveAvatar);
  const standUp = useRoomStore((s) => s.standUp);
  const selectedType = useRoomStore((s) => s.selectedFurnitureType);
  const setSelectedType = useRoomStore((s) => s.setSelectedFurnitureType);
  const user = useAuthStore((s) => s.user);
  const lastError = useRoomStore((s) => s.lastError);
  const clearError = useRoomStore((s) => s.clearError);
  const themeData = THEMES[theme];
  const [zoom, setZoom] = useState(1);

  const shape = ROOM_SHAPES[theme] || ROOM_SHAPES['gaming-den'];

  // Occupied cells for collision detection
  const occupiedCells = useMemo(() => {
    const set = new Set();
    for (const f of furniture) {
      const cat = FURNITURE_CATALOG[f.type];
      if (!cat) continue;
      for (let dx = 0; dx < cat.tileW; dx++)
        for (let dy = 0; dy < cat.tileH; dy++)
          set.add(`${f.x + dx},${f.y + dy}`);
    }
    return set;
  }, [furniture]);

  // Zoom via mouse wheel (Ctrl/Cmd held)
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.4, z + (e.deltaY > 0 ? -0.08 : 0.08))));
    }
  }, []);

  // Floor cell click: place furniture (edit) or move avatar (normal)
  const handleFloorClick = useCallback(async (gx, gy) => {
    if (gx < 0 || gy < 0 || gx >= shape.gridW || gy >= shape.gridH) return;
    if (!isInMask(gx, gy, shape.mask)) return;

    if (isEditing && selectedType) {
      const cat = FURNITURE_CATALOG[selectedType];
      if (!cat) return;
      if (gx + cat.tileW > shape.gridW || gy + cat.tileH > shape.gridH) return;
      for (let dx = 0; dx < cat.tileW; dx++)
        for (let dy = 0; dy < cat.tileH; dy++)
          if (!isInMask(gx + dx, gy + dy, shape.mask) || occupiedCells.has(`${gx + dx},${gy + dy}`)) return;
      const result = await addFurniture(selectedType, gx, gy);
      if (result?.success) setSelectedType(null);
      return;
    }

    if (!isEditing && user) {
      const me = participants[user.id];
      if (me?.seatFurnitureId) standUp(user.id);
      moveAvatar(user.id, gx, gy);
    }
  }, [isEditing, selectedType, shape, occupiedCells, addFurniture, setSelectedType, user, participants, standUp, moveAvatar]);

  // Drag-and-drop from palette onto the canvas
  const handleDragOver = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, [isEditing]);

  // For drag-drop we can't easily get 3D coords without a raycaster,
  // so we convert it to a click-to-place using the selectedType system.
  const handleDrop = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type');
    if (type) setSelectedType(type);
  }, [isEditing, setSelectedType]);

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
        className={`room-view ${isEditing ? 'editing' : ''} ${selectedType ? 'placing' : ''}`}
        style={{ background: themeData.roomBg, position: 'relative' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onWheel={handleWheel}
      >
        <RoomScene3D
          theme={theme}
          zoom={zoom}
          onFloorClick={handleFloorClick}
        />

        {isEditing && furniture.length === 0 && (
          <div className="room-empty" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
            Drag furniture here from the palette
          </div>
        )}
        {lastError && (
          <div className="room-error-toast" role="alert" style={{ zIndex: 20 }}>
            <span>{lastError}</span>
            <button onClick={clearError} aria-label="Dismiss">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
