import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useVoiceStore } from '../stores/voiceStore';
import { standingAvatar, getAvatarPalette } from '../data/sprites/avatarSprites';
import { renderPixelGrid } from '../lib/spriteRenderer';

const AVATAR_SCALE = 3;

export default function StandingAvatar({ participant, screenX, screenY, depth }) {
  const user = useAuthStore((s) => s.user);
  const speakingMap = useVoiceStore((s) => s.speakingMap);

  const isMe = user && participant.id === user.id;
  const isSpeaking = speakingMap[participant.id];

  const avatarUrl = useMemo(() => {
    const palette = getAvatarPalette(participant.color || '#5577bb');
    return renderPixelGrid(standingAvatar.grid, palette, AVATAR_SCALE);
  }, [participant.color]);

  const avatarW = standingAvatar.grid[0].length * AVATAR_SCALE;
  const avatarH = standingAvatar.grid.length * AVATAR_SCALE;

  return (
    <div
      className={`standing-avatar ${isMe ? 'is-me' : ''} ${isSpeaking ? 'speaking' : ''}`}
      style={{
        position: 'absolute',
        left: screenX - avatarW / 2,
        top: screenY - avatarH + 8, // offset up from tile center so feet touch ground
        width: avatarW,
        height: avatarH,
        zIndex: depth + 5,
      }}
      title={participant.displayName}
    >
      <img
        src={avatarUrl}
        className="avatar-sprite"
        style={{ width: avatarW, height: avatarH }}
        draggable={false}
        alt={participant.displayName}
      />
      <div className="avatar-name">{participant.displayName}</div>
      {isSpeaking && <div className="speaking-waves standing" />}
    </div>
  );
}
