import { useMusicStore } from '../stores/musicStore';
import { useRoomStore } from '../stores/roomStore';
import { FURNITURE_CATALOG } from '../data/furniture';

export default function MusicPlayer() {
  const furniture = useRoomStore((s) => s.furniture);
  const isEnabled = useMusicStore((s) => s.isEnabled);
  const volume = useMusicStore((s) => s.volume);
  const toggleMusic = useMusicStore((s) => s.toggleMusic);
  const setVolume = useMusicStore((s) => s.setVolume);

  // Only show if room has a jukebox
  const hasJukebox = furniture.some((f) => f.type === 'jukebox');
  if (!hasJukebox) return null;

  return (
    <div className="music-player">
      <button
        className={`music-toggle ${isEnabled ? 'playing' : ''}`}
        onClick={toggleMusic}
        title={isEnabled ? 'Stop music' : 'Play ambient music'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          {isEnabled ? (
            <>
              <rect x="3" y="3" width="4" height="10" rx="1" />
              <rect x="9" y="3" width="4" height="10" rx="1" />
            </>
          ) : (
            <path d="M4 2 L13 8 L4 14 Z" fill="currentColor" stroke="none" />
          )}
        </svg>
      </button>
      {isEnabled && (
        <input
          type="range"
          className="music-volume"
          min="0"
          max="0.4"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          title="Volume"
        />
      )}
    </div>
  );
}
