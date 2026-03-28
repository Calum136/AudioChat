/**
 * Pixel avatar sprites — Stardew Valley-inspired bobblehead characters.
 * Large round heads (~40% of height), small bodies, warm cozy pixel art.
 * Soft dark brown outlines instead of pure black.
 *
 * Palette indices:
 *   0 = transparent
 *   1 = outline (dark brown #2a1a0e)
 *   2 = skin tone
 *   3 = skin shadow
 *   4 = hair color
 *   5 = shirt primary
 *   6 = shirt shadow
 *   7 = eye color
 *   8 = pants color
 */

// Helper: parse compact hex string rows into number arrays
function p(strings) {
  return strings.map(row =>
    row.split('').map(c => {
      if (c === '.') return 0;
      return parseInt(c, 16);
    })
  );
}

// Sitting avatar — front-facing, Stardew bobblehead style, 16x22
// Big round head with hair, small body sitting on surface
export const sittingAvatar = {
  grid: p([
    //0123456789abcdef
    '....11111111....', //  0: hair outline crown
    '...1444444441...', //  1: hair fill top
    '..144444444441..', //  2: hair sides wide
    '..144444444441..', //  3: hair volume
    '..144222224441..', //  4: forehead, hair on sides
    '.1142772772141..', //  5: eyebrows (7) above eyes
    '.1222272272221..', //  6: eyes (7) in skin
    '..12223322221...', //  7: lower face, nose/mouth (3)
    '...1222222221...', //  8: chin
    '.....12221......', //  9: neck (skin)
    '....1155511.....', // 10: shoulders (shirt)
    '...155566551....', // 11: shirt with shadow fold
    '..12555555521...', // 12: arms (2=skin) shirt body
    '..12555555521...', // 13: arms resting on sides
    '...125555521....', // 14: hands curving to lap
    '...118888811....', // 15: pants top outline
    '...188888881....', // 16: thighs (pants)
    '...188888881....', // 17: bent knees
    '...118888811....', // 18: pants lower outline
    '....1888881.....', // 19: lower legs
    '....1188811.....', // 20: feet stubs
    '......11........', // 21: toe tips
  ]),
  basePalette: [
    'transparent',
    '#2a1a0e',   // 1: outline (soft dark brown)
    '#f0c8a0',   // 2: skin (warm light beige)
    '#d4a878',   // 3: skin shadow / mouth
    '#6b4422',   // 4: hair (brown default)
    '#5577bb',   // 5: shirt primary (blue default)
    '#4466aa',   // 6: shirt shadow
    '#2a1a0e',   // 7: eyes (dark brown)
    '#3d5288',   // 8: pants (darkened blue)
  ],
};

// Standing avatar — same bobblehead proportions, upright, 12x18
// Used in participant panel at smaller display size
export const standingAvatar = {
  grid: p([
    //0123456789ab
    '...111111...', //  0: hair outline
    '..14444441..', //  1: hair fill
    '.1444444441.', //  2: hair wide
    '.1442222441.', //  3: forehead + hair sides
    '.1227722721.', //  4: eyebrows (7) above eyes
    '.1222232221.', //  5: nose/mouth (3) on skin
    '..12222221..', //  6: chin
    '...112211...', //  7: neck
    '...155551...', //  8: shirt shoulders
    '..15566551..', //  9: shirt with shadow
    '..15555551..', // 10: shirt body
    '..11555511..', // 11: shirt bottom
    '...188881...', // 12: pants upper
    '...188881...', // 13: pants mid
    '...188881...', // 14: pants lower
    '...118811...', // 15: pants cuffs
    '...1..1.....', // 16: ankles
    '...1..1.....', // 17: feet
  ]),
  basePalette: [
    'transparent',
    '#2a1a0e',   // 1: outline (soft dark brown)
    '#f0c8a0',   // 2: skin
    '#d4a878',   // 3: skin shadow / mouth
    '#6b4422',   // 4: hair
    '#5577bb',   // 5: shirt
    '#4466aa',   // 6: shirt shadow
    '#2a1a0e',   // 7: eyes
    '#3d5288',   // 8: pants
  ],
};

/**
 * Speaking indicator — 3 arc lines radiating from speaker, 8x7.
 * Single accent color on transparent background.
 */
export const speakingIndicator = {
  grid: p([
    '......1.',
    '..1.1.1.',
    '.1.1.1..',
    '.1.1.1..',
    '.1.1.1..',
    '..1.1.1.',
    '......1.',
  ]),
  palette: [
    'transparent',
    '#4ecdc4',   // teal speaking color
  ],
};

// Darken a hex color by a factor (0-1)
function darkenColor(hex, factor = 0.8) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Available skin tone options for avatar customization
export const SKIN_TONES = [
  '#fce4c8',   // pale peach
  '#f0c8a0',   // light beige (default)
  '#e0a878',   // warm tan
  '#c08050',   // medium brown
  '#8b6040',   // deep brown
  '#6b4030',   // dark brown
];

// Available hair color options
export const HAIR_COLORS = [
  '#2a1a10',   // near-black
  '#4a2a10',   // dark brown
  '#6b4422',   // medium brown (default)
  '#8b6030',   // light brown
  '#c49a50',   // sandy blonde
  '#e8c060',   // golden blonde
  '#aa3322',   // auburn red
  '#cc5533',   // ginger
  '#1a1a3e',   // blue-black
];

/**
 * Generate a color palette for an avatar.
 * If an avatar config object is provided ({ hair, skin, shirt, pants }),
 * use those colors directly. Otherwise fall back to hash-based selection
 * from the user's theme color.
 */
export function getAvatarPalette(userColor, avatarConfig) {
  if (avatarConfig && avatarConfig.hair) {
    return [
      'transparent',
      '#2a1a0e',
      avatarConfig.skin || '#f0c8a0',
      darkenColor(avatarConfig.skin || '#f0c8a0', 0.82),
      avatarConfig.hair,
      avatarConfig.shirt || userColor,
      darkenColor(avatarConfig.shirt || userColor, 0.82),
      '#2a1a0e',
      avatarConfig.pants || darkenColor(avatarConfig.shirt || userColor, 0.70),
    ];
  }
  // Simple hash from color string to pick consistent variations
  const hash = parseInt(userColor.slice(1), 16);

  // Pick skin tone from available set
  const skin = SKIN_TONES[hash % SKIN_TONES.length];

  // Pick hair color from available set
  const hair = HAIR_COLORS[(hash >> 4) % HAIR_COLORS.length];

  return [
    'transparent',            // 0: transparent
    '#2a1a0e',                // 1: outline (soft dark brown)
    skin,                     // 2: skin
    darkenColor(skin, 0.82),       // 3: skin shadow
    hair,                     // 4: hair
    userColor,                // 5: shirt = user's color
    darkenColor(userColor, 0.82),  // 6: shirt shadow
    '#2a1a0e',                // 7: eyes (dark brown)
    darkenColor(userColor, 0.70),  // 8: pants (shirt darkened 30%)
  ];
}
