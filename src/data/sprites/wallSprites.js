/**
 * Isometric wall tile sprites — procedurally generated parallelograms.
 * Left wall: slopes up-right (along gy=0 edge), lit from top-left (lighter).
 * Right wall: slopes up-left (along gx=0 edge), darker (facing away from light).
 *
 * Each wall tile covers one grid cell's edge and extends upward by WALL_HEIGHT.
 * The parallelogram shape is baked into the pixel grid (transparent outside).
 *
 * Habbo Hotel style: clean panel lines, baseboard trim, subtle brick/panel texture.
 */

const HALF_TILE = 32;  // TILE_W / 2
const WALL_H = 80;     // wall height in pixels
const TILE_HALF_H = 16; // TILE_H / 2

// Total sprite height: wall + half tile (the slope at bottom)
const SPRITE_H = WALL_H + TILE_HALF_H;

/**
 * Generate a left wall tile (slopes up-right, gy=0 edge).
 * Parallelogram: top-left at (0, TILE_HALF_H), top-right at (W-1, 0),
 * bottom-right at (W-1, WALL_H), bottom-left at (0, SPRITE_H-1).
 *
 * palette: [transparent, wallBase, wallDark, wallLight, wallTrim, wallPattern, wallHighlight]
 */
function makeLeftWall(palette) {
  const W = HALF_TILE;
  const H = SPRITE_H;
  const grid = [];

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      // Top edge: y_top(x) = TILE_HALF_H * (1 - x / (W - 1))
      // Bottom edge: y_bot(x) = (SPRITE_H - 1) - x * (TILE_HALF_H / (W - 1))
      const topY = TILE_HALF_H * (1 - x / (W - 1));
      const botY = (SPRITE_H - 1) - x * (TILE_HALF_H / (W - 1));

      if (y < topY || y > botY) {
        row.push(0); // transparent
      } else {
        const relY = y - topY;
        const wallHeight = botY - topY;

        // Edge detection
        const isTopEdge = relY < 1;
        const isBotEdge = relY > wallHeight - 3;
        const isLeftEdge = x < 1;
        const isRightEdge = x >= W - 1;

        // Top/bottom/side edges = trim
        if (isTopEdge || isLeftEdge || isRightEdge) {
          row.push(4); // trim
        } else if (isBotEdge) {
          // Baseboard: 3px thick trim at bottom
          row.push(4);
        } else {
          // Wall body — Habbo-style vertical panel strips with horizontal wainscoting
          const panelWidth = 10;
          const panelX = x % panelWidth;
          const isPanelEdge = panelX === 0;

          // Wainscoting line at 60% height
          const wainscotY = wallHeight * 0.6;
          const isWainscot = Math.abs(relY - wainscotY) < 1;

          // Chair rail at 35% height
          const chairRailY = wallHeight * 0.35;
          const isChairRail = Math.abs(relY - chairRailY) < 1;

          if (isPanelEdge || isWainscot || isChairRail) {
            row.push(5); // pattern/groove lines
          } else {
            // Gradient: left side lighter (lit), right side darker
            const t = x / W; // 0 = left edge, 1 = right edge
            if (t < 0.3) {
              // Top portion above wainscot is lighter
              row.push(relY < wainscotY ? 6 : 3); // highlight / light
            } else if (t < 0.65) {
              row.push(relY < wainscotY ? 3 : 1); // light / base
            } else {
              row.push(relY < wainscotY ? 1 : 2); // base / dark
            }
          }
        }
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate a right wall tile (slopes up-left, gx=0 edge).
 * Mirror of left wall. Darker overall (facing away from light).
 */
function makeRightWall(palette) {
  const W = HALF_TILE;
  const H = SPRITE_H;
  const grid = [];

  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      // Top edge: y_top(x) = x * (TILE_HALF_H / (W - 1))
      // Bottom edge: y_bot(x) = WALL_H + x * (TILE_HALF_H / (W - 1))
      const topY = x * (TILE_HALF_H / (W - 1));
      const botY = WALL_H + x * (TILE_HALF_H / (W - 1));

      if (y < topY || y > botY) {
        row.push(0);
      } else {
        const relY = y - topY;
        const wallHeight = botY - topY;

        const isTopEdge = relY < 1;
        const isBotEdge = relY > wallHeight - 3;
        const isLeftEdge = x < 1;
        const isRightEdge = x >= W - 1;

        if (isTopEdge || isLeftEdge || isRightEdge) {
          row.push(4);
        } else if (isBotEdge) {
          row.push(4);
        } else {
          // Right wall is in shadow — darker overall
          const panelWidth = 10;
          const panelX = (W - 1 - x) % panelWidth;
          const isPanelEdge = panelX === 0;

          const wainscotY = wallHeight * 0.6;
          const isWainscot = Math.abs(relY - wainscotY) < 1;

          const chairRailY = wallHeight * 0.35;
          const isChairRail = Math.abs(relY - chairRailY) < 1;

          if (isPanelEdge || isWainscot || isChairRail) {
            row.push(5);
          } else {
            // Gradient: mostly dark, slight lighter spot on left
            const t = x / W;
            if (t < 0.25) {
              row.push(relY < wainscotY ? 1 : 2); // base / dark
            } else if (t < 0.6) {
              row.push(2); // dark
            } else {
              row.push(2); // shadow side stays dark
            }
          }
        }
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate a corner column sprite — vertical pillar where walls meet.
 */
function makeCorner(palette) {
  const W = 6;
  const H = SPRITE_H;
  const grid = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      if (x === 0 || x === W - 1) {
        row.push(4); // edge trim
      } else if (x <= 2) {
        row.push(6); // highlight (lit side)
      } else {
        row.push(2); // dark side
      }
    }
    grid.push(row);
  }
  return grid;
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

export const WALL_TILES = {};

for (const [theme, palette] of Object.entries(WALL_PALETTES)) {
  WALL_TILES[theme] = {
    left: { grid: makeLeftWall(palette), palette },
    right: { grid: makeRightWall(palette), palette },
    corner: { grid: makeCorner(palette), palette },
  };
}

export { WALL_H, SPRITE_H, HALF_TILE, TILE_HALF_H };
