/**
 * Isometric grid utilities.
 * Standard 2:1 diamond projection (Habbo Hotel style).
 */

export const TILE_W = 64;
export const TILE_H = 32;

/**
 * Convert grid coordinates to screen pixel position.
 * Returns the top-center of the diamond tile.
 */
export function isoToScreen(gx, gy, originX = 0, originY = 0) {
  return {
    x: originX + (gx - gy) * (TILE_W / 2),
    y: originY + (gx + gy) * (TILE_H / 2),
  };
}

/**
 * Convert screen pixel position back to grid coordinates.
 * Returns fractional values — round to snap to grid.
 */
export function screenToIso(sx, sy, originX = 0, originY = 0) {
  const rx = sx - originX;
  const ry = sy - originY;
  return {
    gx: (rx / (TILE_W / 2) + ry / (TILE_H / 2)) / 2,
    gy: (ry / (TILE_H / 2) - rx / (TILE_W / 2)) / 2,
  };
}

/**
 * Snap fractional grid coords to nearest integer cell.
 */
export function snapToGrid(gx, gy) {
  return {
    gx: Math.round(gx),
    gy: Math.round(gy),
  };
}

/**
 * Get depth/z-index for a grid cell.
 * Higher values = closer to camera (rendered on top).
 */
export function getDepth(gx, gy) {
  return (gx + gy) * 10;
}

/**
 * Check if a grid cell is within room bounds.
 */
export function isInBounds(gx, gy, roomWidth, roomHeight) {
  return gx >= 0 && gy >= 0 && gx < roomWidth && gy < roomHeight;
}

/**
 * Get all grid cells occupied by a multi-tile furniture piece.
 * @param {number} gx - Top-left grid X
 * @param {number} gy - Top-left grid Y
 * @param {number} tileW - Width in tiles
 * @param {number} tileH - Height in tiles
 */
export function getOccupiedCells(gx, gy, tileW, tileH) {
  const cells = [];
  for (let dx = 0; dx < tileW; dx++) {
    for (let dy = 0; dy < tileH; dy++) {
      cells.push({ gx: gx + dx, gy: gy + dy });
    }
  }
  return cells;
}
