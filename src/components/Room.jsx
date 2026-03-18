import { useRef } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { THEMES } from '../data/themes';
import { FURNITURE_CATALOG } from '../data/furniture';
import FurnitureItem from './FurnitureItem';

export default function Room() {
  const furniture = useRoomStore((s) => s.furniture);
  const theme = useRoomStore((s) => s.theme);
  const isEditing = useRoomStore((s) => s.isEditing);
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const roomRef = useRef(null);
  const themeData = THEMES[theme];

  const handleDragOver = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type');
    if (!type || !FURNITURE_CATALOG[type]) return;
    const rect = roomRef.current.getBoundingClientRect();
    const catalog = FURNITURE_CATALOG[type];
    const x = e.clientX - rect.left - catalog.width / 2;
    const y = e.clientY - rect.top - catalog.height / 2;
    addFurniture(type, x, y);
  };

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
        {furniture.map((item) => (
          <FurnitureItem key={item.id} {...item} />
        ))}
        {isEditing && furniture.length === 0 && (
          <div className="room-empty">Drag furniture here from the palette</div>
        )}
      </div>
    </div>
  );
}
