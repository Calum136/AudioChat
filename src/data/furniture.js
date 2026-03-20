/**
 * Furniture catalog — defines every placeable item.
 * Seating items have `seats` arrays that create voice-call slots.
 * Decor items have no seats (purely visual).
 *
 * `sprite` references a key in FURNITURE_SPRITES (pixel art).
 * `icon` kept for backward compat / palette display.
 * `tileW` / `tileH` define the isometric grid footprint.
 *
 * Seat offsets are now relative to the sprite's render position (pixels from top-left).
 */
export const FURNITURE_CATALOG = {
  couch: {
    name: 'Couch',
    icon: 'couch',
    sprite: 'couch',
    tileW: 2,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: -20, offsetY: -20, label: 'Left cushion' },
      { offsetX: 20, offsetY: -20, label: 'Right cushion' },
    ],
  },
  beanbag: {
    name: 'Bean Bag',
    icon: 'beanbag',
    sprite: 'beanbag',
    tileW: 1,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: 0, offsetY: -20, label: 'Bean bag' },
    ],
  },
  barstool: {
    name: 'Bar Stool',
    icon: 'barstool',
    sprite: 'barstool',
    tileW: 1,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: 0, offsetY: -22, label: 'Stool' },
    ],
  },
  swing: {
    name: 'Swing',
    icon: 'swing',
    sprite: 'swing',
    tileW: 1,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: 0, offsetY: -10, label: 'Swing seat' },
    ],
  },
  gamingchair: {
    name: 'Gaming Chair',
    icon: 'gamingchair',
    sprite: 'gamingchair',
    tileW: 1,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: 0, offsetY: -20, label: 'Gaming chair' },
    ],
  },
  floorcushion: {
    name: 'Floor Cushion',
    icon: 'floorcushion',
    sprite: 'floorcushion',
    tileW: 1,
    tileH: 1,
    category: 'seating',
    seats: [
      { offsetX: 0, offsetY: -18, label: 'Cushion' },
    ],
  },
  table: {
    name: 'Small Table',
    icon: 'table',
    sprite: 'table',
    tileW: 1,
    tileH: 1,
    category: 'decor',
    seats: [],
  },
  shelf: {
    name: 'Shelf',
    icon: 'shelf',
    sprite: 'shelf',
    tileW: 1,
    tileH: 1,
    category: 'decor',
    seats: [],
  },
  lamp: {
    name: 'Lamp',
    icon: 'lamp',
    sprite: 'lamp',
    tileW: 1,
    tileH: 1,
    category: 'decor',
    seats: [],
  },
  poster: {
    name: 'Poster',
    icon: 'poster',
    sprite: 'poster',
    tileW: 1,
    tileH: 1,
    category: 'decor',
    seats: [],
  },
  arcade: {
    name: 'Arcade Machine',
    icon: 'arcade',
    sprite: 'arcade',
    tileW: 1,
    tileH: 1,
    category: 'decor',
    seats: [],
  },
};
