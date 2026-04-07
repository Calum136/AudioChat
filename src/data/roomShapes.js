/**
 * Room shape definitions per theme.
 * Each theme gets a unique floor layout instead of the default 8x8 square.
 *
 * mask: 2D array [gy][gx] where 1 = valid cell, 0 = empty/void.
 *       null = full rectangle (all cells valid).
 * hasWalls: whether to render back walls (false for floating rooms like sci-fi).
 */

export const ROOM_SHAPES = {
  // Gaming Den: 8x8 full square — classic room with LED strip potential
  'gaming-den': {
    gridW: 8,
    gridH: 8,
    mask: null,
    hasWalls: true,
  },

  // Sci-Fi Lounge: 10x8 spaceship silhouette — tapered at top and bottom, floating in space
  'scifi-lounge': {
    gridW: 10,
    gridH: 8,
    mask: [
      //  0  1  2  3  4  5  6  7  8  9
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0], // gy=0 (nose)
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // gy=1
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], // gy=2
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=3 (widest)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=4 (widest)
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], // gy=5
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // gy=6
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0], // gy=7 (tail)
    ],
    hasWalls: false,
  },

  // Fantasy Tavern: 10x8 L-shape — main hall with bar counter section
  'fantasy-tavern': {
    gridW: 10,
    gridH: 8,
    mask: [
      //  0  1  2  3  4  5  6  7  8  9
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // gy=0 (bar area, narrower)
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // gy=1
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // gy=2
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=3 (opens to main hall)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=4
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=5
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=6
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=7
    ],
    hasWalls: true,
  },

  // Retro Arcade: 9x9 plus/cross shape — arcade floor plan
  'retro-arcade': {
    gridW: 9,
    gridH: 9,
    mask: [
      //  0  1  2  3  4  5  6  7  8
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=0
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=1
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=2
      [1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=3 (cross center)
      [1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=4
      [1, 1, 1, 1, 1, 1, 1, 1, 1], // gy=5
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=6
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=7
      [0, 0, 0, 1, 1, 1, 0, 0, 0], // gy=8
    ],
    hasWalls: false,
  },
};

/**
 * Check if a grid cell is valid within a shape mask.
 * Returns true if mask is null (full rectangle) or cell is marked 1.
 */
export function isInMask(gx, gy, mask) {
  if (!mask) return true;
  return mask[gy]?.[gx] === 1;
}

/**
 * Find a valid spawn position within a shape.
 * Tries to place near center of the shape.
 */
export function findSpawnPosition(shape, hash = 0) {
  const { gridW, gridH, mask } = shape;
  const centerX = Math.floor(gridW / 2);
  const centerY = Math.floor(gridH / 2);

  // Try center area first with hash-based offset
  for (let r = 0; r < Math.max(gridW, gridH); r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const gx = centerX + dx + (hash % 3) - 1;
        const gy = centerY + dy + (Math.floor(hash / 3) % 3) - 1;
        if (gx >= 0 && gy >= 0 && gx < gridW && gy < gridH && isInMask(gx, gy, mask)) {
          return { gx, gy };
        }
      }
    }
  }

  // Fallback: first valid cell
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (isInMask(gx, gy, mask)) return { gx, gy };
    }
  }

  return { gx: 0, gy: 0 };
}
