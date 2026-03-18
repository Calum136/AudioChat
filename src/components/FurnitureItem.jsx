import { useState } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { FURNITURE_CATALOG } from '../data/furniture';
import Icon from './Icon';
import SeatMarker from './SeatMarker';

export default function FurnitureItem({ id, type, x, y }) {
  const isEditing = useRoomStore((s) => s.isEditing);
  const moveFurniture = useRoomStore((s) => s.moveFurniture);
  const removeFurniture = useRoomStore((s) => s.removeFurniture);
  const catalog = FURNITURE_CATALOG[type];
  const [dragging, setDragging] = useState(false);

  if (!catalog) return null;

  const handleMouseDown = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const startX = e.clientX - x;
    const startY = e.clientY - y;

    const handleMouseMove = (moveE) => {
      moveFurniture(id, moveE.clientX - startX, moveE.clientY - startY);
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`furniture-item ${isEditing ? 'editable' : ''} ${dragging ? 'dragging' : ''} ${catalog.seats.length > 0 ? 'has-seats' : 'decor'}`}
      style={{
        left: x,
        top: y,
        width: catalog.width,
        height: catalog.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="furniture-body">
        <Icon name={catalog.icon} size={28} className="furniture-icon" />
        <span className="furniture-name">{catalog.name}</span>
      </div>
      {catalog.seats.map((seat, i) => (
        <SeatMarker key={i} furnitureId={id} seatIndex={i} seat={seat} />
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
