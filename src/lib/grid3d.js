/**
 * 3D grid coordinate utilities for the R3F room scene.
 * One grid tile = TILE_UNIT × TILE_UNIT world units (XZ plane, Y is up).
 */

export const TILE_UNIT = 2.0;

/** Grid cell center → Three.js world position [x, y, z] */
export function tileToWorld(gx, gy, yOffset = 0) {
  return [(gx + 0.5) * TILE_UNIT, yOffset, (gy + 0.5) * TILE_UNIT];
}

/** Furniture group origin for a tileW × tileH item placed at (gx, gy) */
export function furnitureWorldPos(gx, gy, tileW = 1, tileH = 1) {
  return [(gx + tileW / 2) * TILE_UNIT, 0, (gy + tileH / 2) * TILE_UNIT];
}

/** World XZ → nearest grid cell (returns { gx, gy }) */
export function worldToTile(wx, wz) {
  return {
    gx: Math.round(wx / TILE_UNIT - 0.5),
    gy: Math.round(wz / TILE_UNIT - 0.5),
  };
}

/** Center of the full room in world space */
export function roomCenter(gridW, gridH) {
  return [(gridW * TILE_UNIT) / 2, 0, (gridH * TILE_UNIT) / 2];
}

/** Isometric camera position: 45° azimuth, ~35° elevation above room center */
export function isoCamera(gridW, gridH, distance = 30) {
  const [cx, , cz] = roomCenter(gridW, gridH);
  return [cx + distance, distance * 0.9, cz + distance];
}
