// InitialAvatar — deterministic-tinted initials circle.
// Ported from Claude Design bundle.

const TINTS = ['#7c5cbf', '#4ecdc4', '#e85d75', '#5c8cbf', '#c850c0', '#e8a838'];

export function InitialAvatar({ name = '?', size = 32, tint }) {
  const safe = name || '?';
  const initials = safe
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const idx = safe.charCodeAt(0) % TINTS.length;
  const c = tint || TINTS[idx];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${c}55, ${c}22)`,
        border: `1px solid ${c}55`,
        color: '#f0eef5',
        fontWeight: 600,
        fontSize: size * 0.38,
        fontFamily: 'var(--font-ui)',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}
