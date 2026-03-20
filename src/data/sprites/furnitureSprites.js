/**
 * Pixel art furniture sprites — isometric perspective.
 * Each sprite is a 2D array of palette indices + its color palette.
 * Index 0 is always transparent.
 *
 * Style: Cozy pixel art inspired by Habbo Hotel, Knights of Pen and Paper.
 * Warm tones, chunky readable shapes at small sizes.
 *
 * Sprites are drawn at 32x24 or 32x32 base resolution and scaled up via
 * image-rendering: pixelated for crisp look at any display size.
 */

// Helper: parse compact string rows into number arrays
function p(strings) {
  return strings.map(row =>
    row.split('').map(c => {
      if (c === '.') return 0;
      return parseInt(c, 16);
    })
  );
}

// ============ SEATING ============

export const couchSprite = {
  grid: p([
    '...............................',
    '...1111111111111111111111111...',
    '..12222222222222222222222221...',
    '..12333333334333333334333321...',
    '..12333333334333333334333321...',
    '..12333333334333333334333321...',
    '.112333333334333333334333321..',
    '.152333333334333333334333321..',
    '.152333333334333333334333321..',
    '.152333333334333333334333321..',
    '.1522222222222222222222222211.',
    '.15555555555555555555555555511.',
    '..1555555555555555555555555511',
    '..115555555555555555555555511.',
    '...11111111111111111111111111..',
    '...16.......................61.',
    '...16.......................61.',
    '....1.......................1..',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: dark outline
    '#8b5e3c',   // 2: wood frame
    '#c4785a',   // 3: cushion main (warm coral)
    '#a35840',   // 4: cushion stitch/shadow
    '#d4956e',   // 5: cushion highlight
    '#3d2816',   // 6: legs
  ],
  // Tile footprint in isometric grid
  tileW: 2,
  tileH: 1,
};

export const beanbagSprite = {
  grid: p([
    '...........',
    '....11111..',
    '...1222221.',
    '..12233221.',
    '..12233321.',
    '.122333321.',
    '.123333321.',
    '.123333321.',
    '.123333211.',
    '..1233211..',
    '..112211...',
    '...1111....',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#6b4c8a',   // 2: bean bag dark purple
    '#8b6aaa',   // 3: bean bag light purple
  ],
  tileW: 1,
  tileH: 1,
};

export const barstoolSprite = {
  grid: p([
    '.........',
    '..11111..',
    '.1222221.',
    '.1233321.',
    '.1222221.',
    '..11111..',
    '....1....',
    '....1....',
    '...111...',
    '....1....',
    '...1.1...',
    '..1...1..',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#8b7355',   // 2: seat wood
    '#a8956e',   // 3: seat highlight
  ],
  tileW: 1,
  tileH: 1,
};

export const swingSprite = {
  grid: p([
    '..1.......1..',
    '..1.......1..',
    '..1.......1..',
    '..1.......1..',
    '..1.......1..',
    '..1.......1..',
    '..11111111...',
    '..12222221...',
    '..12333321...',
    '..12333321...',
    '..12222221...',
    '..11111111...',
  ]),
  palette: [
    'transparent',
    '#3d2816',   // 1: rope/frame
    '#8b5e3c',   // 2: seat dark
    '#c49a6c',   // 3: seat light wood
  ],
  tileW: 1,
  tileH: 1,
};

export const gamingchairSprite = {
  grid: p([
    '....1111....',
    '...122221...',
    '..12344321..',
    '..12344321..',
    '..12344321..',
    '..12344321..',
    '..12222221..',
    '..11111111..',
    '..15555551..',
    '..15566551..',
    '..15555551..',
    '..11111111..',
    '...1....1...',
    '..11....11..',
  ]),
  palette: [
    'transparent',
    '#1a1a2e',   // 1: dark frame
    '#2d2d4a',   // 2: chair body dark
    '#3d3d6a',   // 3: chair body mid
    '#5555aa',   // 4: accent stripe (blue)
    '#2d2d4a',   // 5: seat
    '#5555aa',   // 6: seat accent
  ],
  tileW: 1,
  tileH: 1,
};

export const floorcushionSprite = {
  grid: p([
    '...........',
    '...11111...',
    '..1222221..',
    '.12233221..',
    '.12233321..',
    '.12333321..',
    '..1222211..',
    '...11111...',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#c44e52',   // 2: cushion dark red
    '#e86b6e',   // 3: cushion light red/pink
  ],
  tileW: 1,
  tileH: 1,
};

// ============ DECOR ============

export const tableSprite = {
  grid: p([
    '.................',
    '..111111111111...',
    '.12222222222221..',
    '.12333333333321..',
    '.12222222222221..',
    '..111111111111...',
    '...1.........1...',
    '...1.........1...',
    '...1.........1...',
    '...1.........1...',
    '..11.........11..',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#8b5e3c',   // 2: table dark wood
    '#c49a6c',   // 3: table light wood top
  ],
  tileW: 1,
  tileH: 1,
};

export const shelfSprite = {
  grid: p([
    '...................',
    '.1111111111111111..',
    '.1222222222222221..',
    '.1233422235522221..',
    '.1233422235522221..',
    '.1233422235522221..',
    '.1222222222222221..',
    '.1111111111111111..',
    '.1222222222222221..',
    '.1226622277222221..',
    '.1226622277222221..',
    '.1222222222222221..',
    '.1111111111111111..',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#8b5e3c',   // 2: shelf wood
    '#4488cc',   // 3: book blue
    '#3366aa',   // 4: book blue dark
    '#cc4444',   // 5: book red
    '#44aa66',   // 6: book green
    '#ddaa44',   // 7: book gold
  ],
  tileW: 1,
  tileH: 1,
};

export const lampSprite = {
  grid: p([
    '....111....',
    '...12221...',
    '..1233321..',
    '..1234321..',
    '..1233321..',
    '...12221...',
    '....111....',
    '.....1.....',
    '.....1.....',
    '.....1.....',
    '.....1.....',
    '....111....',
    '...11111...',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#e8c84a',   // 2: lampshade outer
    '#f0e068',   // 3: lampshade light
    '#fff8a0',   // 4: lampshade brightest
  ],
  tileW: 1,
  tileH: 1,
};

export const posterSprite = {
  grid: p([
    '...............',
    '..11111111111..',
    '..12222222221..',
    '..12333333321..',
    '..12344443321..',
    '..12344443321..',
    '..12344443321..',
    '..12333333321..',
    '..12222222221..',
    '..11111111111..',
    '...............',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: frame
    '#4a3a2e',   // 2: mat/border
    '#3a6688',   // 3: poster bg
    '#5a8aaa',   // 4: poster art (lighter area)
  ],
  tileW: 1,
  tileH: 1,
};

export const arcadeSprite = {
  grid: p([
    '..111111111..',
    '..122222221..',
    '..123333321..',
    '..123443321..',
    '..123443321..',
    '..123333321..',
    '..122222221..',
    '..122222221..',
    '..12256221..',
    '..12256221..',
    '..122222221..',
    '..122772221..',
    '..122222221..',
    '..111111111..',
    '..1........1..',
    '..11......11..',
  ]),
  palette: [
    'transparent',
    '#1a1a2e',   // 1: cabinet outline
    '#2d2d4a',   // 2: cabinet body
    '#1a3355',   // 3: screen dark
    '#2a5588',   // 4: screen light
    '#cc4444',   // 5: button red
    '#44cc44',   // 6: button green
    '#e8c84a',   // 7: coin slot
  ],
  tileW: 1,
  tileH: 1,
};

// ============ ALL SPRITES MAP ============

export const FURNITURE_SPRITES = {
  couch: couchSprite,
  beanbag: beanbagSprite,
  barstool: barstoolSprite,
  swing: swingSprite,
  gamingchair: gamingchairSprite,
  floorcushion: floorcushionSprite,
  table: tableSprite,
  shelf: shelfSprite,
  lamp: lampSprite,
  poster: posterSprite,
  arcade: arcadeSprite,
};
