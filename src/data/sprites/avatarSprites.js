/**
 * Pixel avatar sprites — small isometric sitting characters.
 * Base template with palette swap slots for customization.
 *
 * Palette indices:
 *   0 = transparent
 *   1 = outline (dark)
 *   2 = skin tone
 *   3 = skin shadow
 *   4 = hair color
 *   5 = shirt primary
 *   6 = shirt shadow
 *   7 = eye color
 */

// Helper
function p(strings) {
  return strings.map(row =>
    row.split('').map(c => {
      if (c === '.') return 0;
      return parseInt(c, 16);
    })
  );
}

// Sitting avatar — front-facing isometric, 12x16
export const sittingAvatar = {
  grid: p([
    '....1111....',
    '...144441...',
    '..14444441..',
    '..14422441..',
    '..12272721..',
    '..12322321..',
    '..11222211..',
    '...155551...',
    '..15566551..',
    '..15555551..',
    '..15555551..',
    '..11555511..',
    '...122221...',
    '...1.22.1...',
    '...1.11.1...',
    '....1..1....',
  ]),
  basePalette: [
    'transparent',
    '#1a1020',   // 1: outline
    '#e8b88a',   // 2: skin
    '#c89870',   // 3: skin shadow
    '#6b4422',   // 4: hair (brown default)
    '#5577bb',   // 5: shirt primary (blue default)
    '#4466aa',   // 6: shirt shadow
    '#1a1020',   // 7: eyes
  ],
};

// Standing avatar — for participant panel (smaller, 8x12)
export const standingAvatar = {
  grid: p([
    '..1111..',
    '.144441.',
    '.142241.',
    '.127721.',
    '.122221.',
    '..1551..',
    '.155551.',
    '.155551.',
    '.155551.',
    '..1221..',
    '..1..1..',
    '..1..1..',
  ]),
  basePalette: [
    'transparent',
    '#1a1020',   // 1: outline
    '#e8b88a',   // 2: skin
    '#c89870',   // 3: skin shadow
    '#6b4422',   // 4: hair
    '#5577bb',   // 5: shirt
    '#4466aa',   // 6: shirt shadow
    '#1a1020',   // 7: eyes
  ],
};

/**
 * Generate a color palette for an avatar based on a user's theme color.
 * Maps the user's assigned color to the shirt, and picks complementary
 * hair and skin tones.
 */
export function getAvatarPalette(userColor) {
  // Darken a hex color by a factor
  function darken(hex, factor = 0.8) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Simple hash from color to pick variations
  const hash = parseInt(userColor.slice(1), 16);

  // Skin tones (small set)
  const skins = ['#f4c8a0', '#e8b88a', '#d4a070', '#c08050', '#8b6040'];
  const skin = skins[hash % skins.length];

  // Hair colors
  const hairs = ['#2a1a10', '#4a2a10', '#6b4422', '#8b6030', '#c49a50', '#aa3322', '#1a1a2e'];
  const hair = hairs[(hash >> 4) % hairs.length];

  return [
    'transparent',
    '#1a1020',          // outline
    skin,               // skin
    darken(skin, 0.82), // skin shadow
    hair,               // hair
    userColor,          // shirt = user's color
    darken(userColor, 0.82), // shirt shadow
    '#1a1020',          // eyes
  ];
}

/**
 * Speaking indicator — small pixel speech lines (3 arcs).
 * Rendered next to avatar when speaking.
 */
export const speakingIndicator = {
  grid: p([
    '....1.',
    '..1.1.',
    '..1.1.',
    '..1.1.',
    '....1.',
  ]),
  palette: [
    'transparent',
    '#4ecdc4',   // teal speaking color
  ],
};
