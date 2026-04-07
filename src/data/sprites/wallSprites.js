/**
 * Isometric wall sprites — one large sprite per wall face.
 * Instead of tiling small parallelogram tiles (which creates gaps),
 * we generate a single sprite for the entire left wall and right wall.
 *
 * Left wall: runs along gy=0 edge (slopes down-right), lit from top-left.
 * Right wall: runs along gx=0 edge (slopes down-left), in shadow.
 */

const TILE_W = 64;
const HALF_TILE = 32;
const TILE_H = 32;
const TILE_HALF_H = 16;
const WALL_H = 80;

/**
 * Generate a complete left wall sprite for N grid cells.
 * The wall is a large parallelogram: top-left at (0, TILE_HALF_H),
 * top-right at (N * HALF_TILE, TILE_HALF_H + N * TILE_HALF_H - TILE_HALF_H),
 * extending WALL_H pixels down from the top edge.
 *
 * Returns { grid, palette, width, height }
 */
function makeFullLeftWall(gridSize, palette) {
  const W = gridSize * HALF_TILE;
  const H = WALL_H + (gridSize - 1) * TILE_HALF_H + TILE_HALF_H;
  const grid = [];

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      // Top edge slopes down-right: y_top(x) = TILE_HALF_H + x * (TILE_HALF_H / HALF_TILE) - TILE_HALF_H
      // Simplified: y_top(x) = x * 0.5  (the iso 2:1 slope)
      const topY = x * (TILE_HALF_H / HALF_TILE);
      const botY = topY + WALL_H;

      if (y < topY || y > botY) {
        row.push(0); // transparent
      } else {
        const relY = y - topY;

        // Edge detection
        const isTopEdge = relY < 1;
        const isBotEdge = relY > WALL_H - 3;
        const isLeftEdge = x < 1;
        const isRightEdge = x >= W - 1;

        if (isTopEdge || isLeftEdge || isRightEdge) {
          row.push(4); // trim
        } else if (isBotEdge) {
          row.push(4); // baseboard
        } else {
          // Panel texture
          const panelWidth = 12;
          const panelX = x % panelWidth;
          const isPanelEdge = panelX === 0;

          // Wainscoting at 60% wall height
          const wainscotY = WALL_H * 0.6;
          const isWainscot = Math.abs(relY - wainscotY) < 1;

          // Chair rail at 35%
          const chairRailY = WALL_H * 0.35;
          const isChairRail = Math.abs(relY - chairRailY) < 1;

          if (isPanelEdge || isWainscot || isChairRail) {
            row.push(5); // pattern lines
          } else {
            // Gradient: left lighter (lit), right darker
            const t = x / W;
            if (t < 0.35) {
              row.push(relY < wainscotY ? 6 : 3);
            } else if (t < 0.65) {
              row.push(relY < wainscotY ? 3 : 1);
            } else {
              row.push(relY < wainscotY ? 1 : 2);
            }
          }
        }
      }
    }
    grid.push(row);
  }
  return { grid, palette, width: W, height: H };
}

/**
 * Generate a complete right wall sprite for N grid cells.
 * Slopes down-left. Darker overall (shadow side).
 */
function makeFullRightWall(gridSize, palette) {
  const W = gridSize * HALF_TILE;
  const H = WALL_H + (gridSize - 1) * TILE_HALF_H + TILE_HALF_H;
  const grid = [];

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      // Top edge slopes down-left: y_top(x) = (W - 1 - x) * 0.5
      const topY = (W - 1 - x) * (TILE_HALF_H / HALF_TILE);
      const botY = topY + WALL_H;

      if (y < topY || y > botY) {
        row.push(0);
      } else {
        const relY = y - topY;

        const isTopEdge = relY < 1;
        const isBotEdge = relY > WALL_H - 3;
        const isLeftEdge = x < 1;
        const isRightEdge = x >= W - 1;

        if (isTopEdge || isLeftEdge || isRightEdge) {
          row.push(4);
        } else if (isBotEdge) {
          row.push(4);
        } else {
          // Darker overall — right wall in shadow
          const panelWidth = 12;
          const panelX = (W - 1 - x) % panelWidth;
          const isPanelEdge = panelX === 0;

          const wainscotY = WALL_H * 0.6;
          const isWainscot = Math.abs(relY - wainscotY) < 1;

          const chairRailY = WALL_H * 0.35;
          const isChairRail = Math.abs(relY - chairRailY) < 1;

          if (isPanelEdge || isWainscot || isChairRail) {
            row.push(5);
          } else {
            // Mostly dark with slight variation
            const t = x / W;
            if (t < 0.3) {
              row.push(relY < wainscotY ? 1 : 2);
            } else {
              row.push(2);
            }
          }
        }
      }
    }
    grid.push(row);
  }
  return { grid, palette, width: W, height: H };
}

/**
 * Generate a corner column sprite.
 */
function makeCorner(palette) {
  const W = 4;
  const H = WALL_H;
  const grid = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      if (x === 0 || x === W - 1) {
        row.push(4);
      } else if (x === 1) {
        row.push(6);
      } else {
        row.push(2);
      }
    }
    grid.push(row);
  }
  return { grid, palette, width: W, height: H };
}

// Theme wall palettes: [transparent, base, dark, light, trim, pattern, highlight]
const WALL_PALETTES = {
  'gaming-den': [
    'transparent',
    '#2a1f35',   // 1: base
    '#1e1528',   // 2: dark/shadow
    '#352840',   // 3: light/lit
    '#4a3860',   // 4: trim/highlight
    '#231a2e',   // 5: pattern lines
    '#403050',   // 6: highlight (lit panels)
  ],
  'scifi-lounge': [
    'transparent',
    '#152535',   // 1: base
    '#0a1520',   // 2: dark
    '#1d3045',   // 3: light
    '#2a5a7a',   // 4: trim (cyan accent)
    '#0e1c2a',   // 5: pattern
    '#254055',   // 6: highlight
  ],
  'fantasy-tavern': [
    'transparent',
    '#3a2a18',   // 1: base (wood)
    '#2a1a0c',   // 2: dark
    '#4a3824',   // 3: light
    '#5a4828',   // 4: trim
    '#302010',   // 5: pattern (plank lines)
    '#584030',   // 6: highlight
  ],
  'retro-arcade': [
    'transparent',
    '#281540',   // 1: base
    '#180c2a',   // 2: dark
    '#321a50',   // 3: light
    '#4a2870',   // 4: trim (magenta accent)
    '#1e1030',   // 5: pattern
    '#3a2058',   // 6: highlight
  ],
};

const GRID_SIZE = 8;

export const WALL_SPRITES = {};

for (const [theme, palette] of Object.entries(WALL_PALETTES)) {
  WALL_SPRITES[theme] = {
    left: makeFullLeftWall(GRID_SIZE, palette),
    right: makeFullRightWall(GRID_SIZE, palette),
    corner: makeCorner(palette),
  };
}

// Cache for dynamically-sized wall sprites
const _wallCache = new Map();

/**
 * Get wall sprites for a given theme and grid width.
 * Uses cached default WALL_SPRITES for size 8, generates on demand for other sizes.
 */
export function getWallSprites(theme, gridW) {
  if (gridW === 8 && WALL_SPRITES[theme]) return WALL_SPRITES[theme];
  const key = `${theme}-${gridW}`;
  if (_wallCache.has(key)) return _wallCache.get(key);
  const palette = WALL_PALETTES[theme];
  if (!palette) return null;
  const sprites = {
    left: makeFullLeftWall(gridW, palette),
    right: makeFullRightWall(gridW, palette),
    corner: makeCorner(palette),
  };
  _wallCache.set(key, sprites);
  return sprites;
}

export { WALL_H, TILE_HALF_H, HALF_TILE, GRID_SIZE };
