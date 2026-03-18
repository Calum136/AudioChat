/**
 * Furniture catalog — defines every placeable item.
 * Seating items have `seats` arrays that create voice-call slots.
 * Decor items have no seats (purely visual).
 *
 * `icon` references a key in Icon.jsx. Can be swapped for image URLs later.
 */
export const FURNITURE_CATALOG = {
  couch: {
    name: 'Couch',
    icon: 'couch',
    width: 140,
    height: 70,
    category: 'seating',
    seats: [
      { offsetX: 35, offsetY: -18, label: 'Left cushion' },
      { offsetX: 105, offsetY: -18, label: 'Right cushion' },
    ],
  },
  beanbag: {
    name: 'Bean Bag',
    icon: 'beanbag',
    width: 70,
    height: 70,
    category: 'seating',
    seats: [
      { offsetX: 35, offsetY: -16, label: 'Bean bag' },
    ],
  },
  barstool: {
    name: 'Bar Stool',
    icon: 'barstool',
    width: 50,
    height: 55,
    category: 'seating',
    seats: [
      { offsetX: 25, offsetY: -16, label: 'Stool' },
    ],
  },
  swing: {
    name: 'Swing',
    icon: 'swing',
    width: 60,
    height: 80,
    category: 'seating',
    seats: [
      { offsetX: 30, offsetY: 10, label: 'Swing seat' },
    ],
  },
  gamingchair: {
    name: 'Gaming Chair',
    icon: 'gamingchair',
    width: 60,
    height: 70,
    category: 'seating',
    seats: [
      { offsetX: 30, offsetY: -16, label: 'Gaming chair' },
    ],
  },
  floorcushion: {
    name: 'Floor Cushion',
    icon: 'floorcushion',
    width: 55,
    height: 55,
    category: 'seating',
    seats: [
      { offsetX: 27, offsetY: -14, label: 'Cushion' },
    ],
  },
  table: {
    name: 'Small Table',
    icon: 'table',
    width: 80,
    height: 60,
    category: 'decor',
    seats: [],
  },
  shelf: {
    name: 'Shelf',
    icon: 'shelf',
    width: 90,
    height: 40,
    category: 'decor',
    seats: [],
  },
  lamp: {
    name: 'Lamp',
    icon: 'lamp',
    width: 40,
    height: 40,
    category: 'decor',
    seats: [],
  },
  poster: {
    name: 'Poster',
    icon: 'poster',
    width: 60,
    height: 50,
    category: 'decor',
    seats: [],
  },
  arcade: {
    name: 'Arcade Machine',
    icon: 'arcade',
    width: 60,
    height: 80,
    category: 'decor',
    seats: [],
  },
};
