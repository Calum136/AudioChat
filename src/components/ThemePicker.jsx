import { useRoomStore } from '../stores/roomStore';
import { THEMES } from '../data/themes';

export default function ThemePicker() {
  const theme = useRoomStore((s) => s.theme);
  const setTheme = useRoomStore((s) => s.setTheme);

  return (
    <div className="theme-picker">
      {Object.entries(THEMES).map(([key, t]) => (
        <button
          key={key}
          className={`theme-btn ${theme === key ? 'active' : ''}`}
          onClick={() => setTheme(key)}
          title={t.name}
          style={{ '--theme-accent': t.accent }}
        >
          <span className="theme-swatch" />
        </button>
      ))}
    </div>
  );
}
