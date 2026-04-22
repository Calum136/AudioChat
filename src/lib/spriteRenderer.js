/**
 * Pixel art sprite renderer.
 * Converts 2D arrays of palette indices into crisp pixel art data URLs.
 * Caches results so each sprite is rendered only once.
 */

// LRU sprite cache. Map preserves insertion order, so re-inserting on hit
// moves an entry to the "most recent" end; we evict from the front.
const CACHE_MAX = 500;
const cache = new Map();

/**
 * Render a pixel grid to a data URL.
 * @param {number[][]} grid - 2D array of palette indices (0 = transparent)
 * @param {string[]} palette - Array of hex colors (index 0 is always transparent)
 * @param {number} scale - Pixel scale factor (default 1, meaning 1 grid cell = 1px)
 * @returns {string} data URL of the rendered sprite
 */
export function renderPixelGrid(grid, palette, scale = 1) {
  const key = JSON.stringify({ grid, palette, scale });
  if (cache.has(key)) {
    const hit = cache.get(key);
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = grid[y][x];
      if (idx === 0) continue; // transparent
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  const url = canvas.toDataURL('image/png');
  cache.set(key, url);
  if (cache.size > CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  return url;
}

/**
 * Render a sprite with palette swap (for recoloring avatars, furniture variants).
 * @param {number[][]} grid - 2D array of palette indices
 * @param {string[]} basePalette - Original palette
 * @param {Object} swaps - { paletteIndex: newHexColor }
 * @param {number} scale - Pixel scale factor
 * @returns {string} data URL
 */
export function renderWithSwaps(grid, basePalette, swaps, scale = 1) {
  const palette = basePalette.map((c, i) => swaps[i] || c);
  return renderPixelGrid(grid, palette, scale);
}

/**
 * Clear the sprite cache (e.g., on hot reload).
 */
export function clearSpriteCache() {
  cache.clear();
}
