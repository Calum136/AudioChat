import { FURNITURE_CATALOG } from '../data/furniture';
import { useRoomStore } from '../stores/roomStore';
import Icon from './Icon';

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
            <div
              key={type}
              className="palette-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('furniture-type', type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <Icon name={item.icon} size={28} className="palette-icon" />
              <span className="palette-name">{item.name}</span>
              <span className="palette-seats">
                {item.seats.length}s
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h4>Decor</h4>
        <div className="palette-grid">
          {decor.map(([type, item]) => (
            <div
              key={type}
              className="palette-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('furniture-type', type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <Icon name={item.icon} size={28} className="palette-icon" />
              <span className="palette-name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
