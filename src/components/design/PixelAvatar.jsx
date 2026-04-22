// PixelAvatar — deterministic blocky pixel-art placeholder.
// Not tied to the real pixel sprite system — this is a visual stand-in
// from the Claude Design bundle for use in friend lists / participant
// chips where rendering the full sprite would be overkill.

export function PixelAvatar({ name = '?', size = 40, palette }) {
  const safe = name || '?';
  const seed = [...safe].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n) => Math.abs(Math.sin(seed + n) * 9999) % 1;
  const pals = palette || [
    ['#2a2040', '#e8a838', '#f0cf87', '#7c5cbf'],
    ['#102025', '#4ecdc4', '#9ce8e0', '#1a1a30'],
    ['#2b1020', '#e85d75', '#f2a4b0', '#1a1a30'],
  ];
  const p = pals[Math.floor(rand(0) * pals.length)];
  const grid = 8;
  const cells = [];
  // Symmetric face — mirror left half to right
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid / 2; x++) {
      const r = rand(y * grid + x + 1);
      let color = p[0];
      if (y < 2) color = 'transparent';
      else if (y < 4) color = r > 0.4 ? p[2] : p[1]; // hair
      else if (y === 4 || y === 5) color = r > 0.3 ? p[2] : p[0]; // face
      else color = r > 0.35 ? p[3] : p[1]; // body
      cells.push({ x, y, color });
      cells.push({ x: grid - 1 - x, y, color });
    }
  }
  const s = size / grid;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        imageRendering: 'pixelated',
        background: 'transparent',
        borderRadius: 4,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.x * s,
            top: c.y * s,
            width: s + 0.4,
            height: s + 0.4,
            background: c.color,
          }}
        />
      ))}
    </div>
  );
}
