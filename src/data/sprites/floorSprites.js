/**
 * Isometric floor tile sprites — one per theme.
 * Each tile is a 64x32 diamond (standard 2:1 iso tile).
 * Stored as pixel grids for consistency with furniture sprites.
 *
 * The diamond shape: top point at (32,0), right at (63,16), bottom at (32,31), left at (0,16).
 */

// Helper to generate a diamond-shaped floor tile
// fills with base color and optional pattern
function makeDiamondTile(baseColor, darkColor, lightColor, patternFn) {
  const W = 64;
  const H = 32;
  const grid = [];

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      // Diamond bounds: |x - 32| / 32 + |y - 16| / 16 <= 1
      const dx = Math.abs(x - 31.5) / 32;
      const dy = Math.abs(y - 15.5) / 16;
      if (dx + dy <= 1.0) {
        // Inside diamond
        const isEdge = dx + dy > 0.92;
        if (isEdge) {
          row.push(1); // outline
        } else if (patternFn && patternFn(x, y)) {
          row.push(3); // pattern accent
        } else if (y < 16) {
          row.push(2); // top half (lighter)
        } else {
          row.push(4); // bottom half (darker)
        }
      } else {
        row.push(0); // transparent
      }
    }
    grid.push(row);
  }
  return grid;
}

// Grid line pattern — subtle lines every 16px
const gridPattern = (x, y) => (x % 16 === 0 || y % 8 === 0);

// Checkerboard pattern
const checkerPattern = (x, y) => ((Math.floor(x / 8) + Math.floor(y / 4)) % 2 === 0);

// Plank pattern — horizontal lines
const plankPattern = (x, _y) => (x % 12 === 0);

// Tech grid pattern — dots
const techPattern = (x, y) => (x % 8 === 0 && y % 8 === 0);

export const FLOOR_TILES = {
  'gaming-den': {
    grid: makeDiamondTile('#2a1a30', '#1a1020', '#352040', null),
    palette: [
      'transparent',
      '#1a1020',   // 1: outline
      '#2a1a30',   // 2: top (lighter purple carpet)
      '#352040',   // 3: pattern accent
      '#221828',   // 4: bottom (darker)
    ],
  },
  'scifi-lounge': {
    grid: makeDiamondTile('#0d1a2a', '#081020', '#1a2a3a', techPattern),
    palette: [
      'transparent',
      '#0a1828',   // 1: outline (dark blue)
      '#152535',   // 2: top
      '#1a4a6a',   // 3: tech grid dots (cyan tint)
      '#0d1d2d',   // 4: bottom
    ],
  },
  'fantasy-tavern': {
    grid: makeDiamondTile('#3d2816', '#2a1a0e', '#4a3520', plankPattern),
    palette: [
      'transparent',
      '#1a0e06',   // 1: outline (dark wood)
      '#4a3520',   // 2: top (lighter wood)
      '#3a2510',   // 3: plank lines
      '#362010',   // 4: bottom (darker wood)
    ],
  },
  'retro-arcade': {
    grid: makeDiamondTile('#1a0d28', '#100820', '#280d38', checkerPattern),
    palette: [
      'transparent',
      '#0a0414',   // 1: outline
      '#201030',   // 2: top
      '#301848',   // 3: checker accent (magenta tint)
      '#180c24',   // 4: bottom
    ],
  },
};
