/**
 * Pixel art furniture sprites — 3D isometric perspective.
 * Each sprite is a 2D array of palette indices + its color palette.
 * Index 0 is always transparent.
 *
 * Style: Habbo Hotel / Stardew Valley — warm isometric pixel art.
 * Light source: top-left. Three visible faces on boxy items:
 *   - Top face: brightest
 *   - Left face: medium (lit)
 *   - Right face: darkest (shadow)
 * Soft dark brown outlines (#2a1a0e), warm tones, 1-2px drop shadows.
 *
 * Sprites rendered at base resolution and scaled via
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
    '.................................',
    '...11111111111111111111111111....',
    '..1788888888817888888881788881...',
    '..17899d99998179d9999981789d981..',
    '..178999999981799999998178999a1..',
    '..17899d999981799d99998178999a1..',
    '..17899999998179999999817899a81..',
    '.117888888888178888888817888881..',
    '.1522222222221222222222122222211.',
    '.15233d33332213333d33221333332b1.',
    '.15233333332213333333221333332b1.',
    '.152333d3332213333d3322.133332b1.',
    '.15222222222212222222..12222222b1',
    '..155555555551555555511155555bb1.',
    '..1155555555515555555111555555b1.',
    '...11111111111111111111111111111.',
    '...1c.......................1c1..',
    '...1c.......................1c1..',
    '....1.......................11...',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: dark outline
    '#7a4e30',   // 2: wood frame left (lit)
    '#5c3a22',   // 3: wood frame front
    '#fff8a0',   // 4: (unused)
    '#c4956e',   // 5: cushion base highlight
    '#a0785a',   // 6: (unused)
    '#a35840',   // 7: backrest left face
    '#c4785a',   // 8: backrest top / front face
    '#e89878',   // 9: cushion top (brightest)
    '#b86850',   // a: cushion right face (shadow)
    '#d4a080',   // b: cushion shadow side
    '#3d2816',   // c: legs
    '#f0a888',   // d: cushion highlight stitch
  ],
  tileW: 2,
  tileH: 1,
};

export const beanbagSprite = {
  grid: p([
    '..............',
    '.....11111....',
    '...11677761...',
    '..1677777761..',
    '..1677788761..',
    '.16777788761..',
    '.16777777761..',
    '.16555577761..',
    '.165555576a1..',
    '..155555a61...',
    '..1155aa11....',
    '...1111111....',
    '....1bb1b1....',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#4a2a5a',   // 2: (unused)
    '#6b3c8a',   // 3: (unused)
    '#8b5aaa',   // 4: (unused)
    '#7b5c9a',   // 5: left face (lit)
    '#6b4c8a',   // 6: right face (shadow)
    '#9b7aba',   // 7: top highlight
    '#c4a8da',   // 8: top brightest spot
    '#5a3c7a',   // 9: (unused)
    '#4a2c6a',   // a: deep shadow bottom-right
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const barstoolSprite = {
  grid: p([
    '.............',
    '....11111....',
    '...1777761...',
    '..17788876a1.',
    '..17788876a1.',
    '...1666661...',
    '....15551....',
    '.....151.....',
    '.....151.....',
    '....15551....',
    '.....151.....',
    '....15.51....',
    '...15...51...',
    '...1b...1b...',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#6a5040',   // 2: (unused)
    '#8b6a50',   // 3: (unused)
    '#a08868',   // 4: (unused)
    '#706050',   // 5: metal legs (medium)
    '#585048',   // 6: seat right face (shadow)
    '#b8a078',   // 7: seat top (brightest)
    '#d0c098',   // 8: seat top highlight
    '#5a4a3a',   // 9: (unused)
    '#4a3a2a',   // a: seat shadow edge
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const swingSprite = {
  grid: p([
    '..1.........1..',
    '..2.........2..',
    '..2.........2..',
    '..2.........2..',
    '..2.........2..',
    '..2.........2..',
    '..11111111111..',
    '..1566666665a1.',
    '..15677777654a.',
    '..15677777654a.',
    '..1544444445aa.',
    '..11111111111a.',
    '...............',
    '...1b.....1b...',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: rope/frame outline
    '#5a4030',   // 2: rope
    '#7a5a40',   // 3: (unused)
    '#8b6a4c',   // 4: seat front face (shadow)
    '#a0784c',   // 5: seat left face (lit)
    '#c49a6c',   // 6: seat top face (brightest)
    '#dab888',   // 7: seat top highlight
    '#705838',   // 8: (unused)
    '#604830',   // 9: (unused)
    '#3d2816',   // a: right face shadow
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const gamingchairSprite = {
  grid: p([
    '.....1111......',
    '....1677761....',
    '...167788761...',
    '...1677aa761...',
    '...1677aa761...',
    '...167788761...',
    '...1677776b1...',
    '...16666666b1..',
    '..1188888881...',
    '..118899888b1..',
    '..118899888b1..',
    '..118888888b1..',
    '..11111111111..',
    '...15....151...',
    '..155....1551..',
    '..1c......1c...',
  ]),
  palette: [
    'transparent',
    '#1a1a2e',   // 1: dark frame outline
    '#2a2a4a',   // 2: (unused)
    '#3a3a5a',   // 3: (unused)
    '#4a4a6a',   // 4: (unused)
    '#404060',   // 5: wheel / base
    '#3d3d6a',   // 6: back left face (lit)
    '#4d4d8a',   // 7: back top/front
    '#6666bb',   // 8: seat/back mid
    '#7777dd',   // 9: accent stripe (blue bright)
    '#5a5aaa',   // a: accent stripe (blue)
    '#2d2d4a',   // b: right face (shadow)
    '#0e0e1a',   // c: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const floorcushionSprite = {
  grid: p([
    '...............',
    '.....11111.....',
    '...117777711...',
    '..17778887761..',
    '..17778887761..',
    '..1777788776a1.',
    '..166666666aa1.',
    '...15555555a1..',
    '....1111111....',
    '.....1bb1b.....',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#8a2a30',   // 2: (unused)
    '#a03a40',   // 3: (unused)
    '#b84a50',   // 4: (unused)
    '#a03848',   // 5: front face bottom edge
    '#c44e52',   // 6: left face (lit)
    '#e87878',   // 7: top face (bright)
    '#f8a0a0',   // 8: top highlight (brightest)
    '#b04048',   // 9: (unused)
    '#8a2a30',   // a: right face (shadow)
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

// ============ DECOR ============

export const tableSprite = {
  grid: p([
    '.....................',
    '...1111111111111111..',
    '..178888888888888761.',
    '.17899999999999998761',
    '.1789999999999999876a',
    '.178888888888888887a.',
    '..16666666666666667a.',
    '..1a66666666666666a1.',
    '...1a...........1a1..',
    '...1a...........1a1..',
    '...1a...........1a1..',
    '...1a...........1a1..',
    '...11b..........11b..',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#6a4420',   // 2: (unused)
    '#8b5a30',   // 3: (unused)
    '#a07040',   // 4: (unused)
    '#b88850',   // 5: (unused)
    '#7a5030',   // 6: left face (lit)
    '#5a3820',   // 7: right face leg (shadow)
    '#a07848',   // 8: table top front
    '#c49a6c',   // 9: table top (brightest)
    '#4a2a18',   // a: leg/right shadow
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const shelfSprite = {
  grid: p([
    '......................',
    '.11111111111111111111.',
    '.188888888888888888a1.',
    '.1839942285562288a81..',
    '.183994228556228a881..',
    '.1839942285562288a81..',
    '.188888888888888888a1.',
    '.11111111111111111111.',
    '.188888888888888888a1.',
    '.18266228877228a8881..',
    '.182662288772288a881..',
    '.18266228877228a8881..',
    '.188888888888888888a1.',
    '.11111111111111111111.',
    '..1b..................',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#44aa66',   // 2: book green
    '#4488cc',   // 3: book blue
    '#3366aa',   // 4: book blue shadow
    '#cc5555',   // 5: book red
    '#aa3838',   // 6: book red shadow
    '#ddaa44',   // 7: book gold
    '#8b6a40',   // 8: shelf wood lit
    '#c49a6c',   // 9: shelf top face
    '#6a4a2a',   // a: shelf shadow face
    '#1a0e06',   // b: drop shadow
  ],
  tileW: 1,
  tileH: 1,
};

export const lampSprite = {
  grid: p([
    '......111......',
    '.....17761.....',
    '....1789861....',
    '...178999861...',
    '..178999c8a61..',
    '..178c99a8a61..',
    '...1788aa61....',
    '....176a61.....',
    '.....1111......',
    '......51.......',
    '......51.......',
    '......51.......',
    '......51.......',
    '....155551.....',
    '...1555555a1...',
    '...1155aaa11...',
    '....1bb1b1.....',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#b8a030',   // 2: (unused)
    '#d0b840',   // 3: (unused)
    '#e8d060',   // 4: (unused)
    '#706050',   // 5: base/stand (medium)
    '#504838',   // 6: shade shadow right
    '#e8c84a',   // 7: shade left (lit)
    '#f0e068',   // 8: shade top/front
    '#fff8a0',   // 9: shade brightest (glow)
    '#c0a030',   // a: shade right face (shadow)
    '#1a0e06',   // b: drop shadow
    '#ffffd0',   // c: warm glow hotspot
  ],
  tileW: 1,
  tileH: 1,
};

export const posterSprite = {
  grid: p([
    '..................',
    '..111111111111111.',
    '..1888888888888a1.',
    '..18777c777c7a8a1.',
    '..187c7d7c7d78a.1.',
    '..187b9e99b978a..1',
    '..18799e99b978a..1',
    '..187b99e9b978a.1.',
    '..18777c7c7c7a8a1.',
    '..1888888888888a1.',
    '..1aaaaaaaaaaaa1a.',
    '..111111111111111.',
    '..................',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: frame outline
    '#5a4030',   // 2: (unused)
    '#6a5040',   // 3: (unused)
    '#7a6050',   // 4: (unused)
    '#8a7060',   // 5: (unused)
    '#4a3a2e',   // 6: (unused)
    '#2a4a6a',   // 7: poster dark bg
    '#5a8aaa',   // 8: frame/mat lit face
    '#6a9ab8',   // 9: poster mid tone
    '#3a2a1e',   // a: frame shadow face
    '#4a7a98',   // b: mountain/landscape dark
    '#e8c84a',   // c: star/sparkle gold
    '#8abaca',   // d: sky highlight
    '#ffdd66',   // e: focal star bright
  ],
  tileW: 1,
  tileH: 1,
};

export const arcadeSprite = {
  grid: p([
    '...1111111111...',
    '..18888888886a..',
    '..188888888866a.',
    '..18933433986a..',
    '..18934443986a..',
    '..18943334986a..',
    '..18933433986a..',
    '..188888888866a.',
    '..1888888888b6a.',
    '..188c5d5c886a..',
    '..188c5d5c886a..',
    '..188888888866a.',
    '..188eee88886a..',
    '..188e8e8888b6a.',
    '..188888888866a.',
    '..111111111116a.',
    '..1a.........1a.',
    '..1a.........1a.',
    '..11b........11b',
  ]),
  palette: [
    'transparent',
    '#1a1a2e',   // 1: cabinet outline
    '#2a2a4a',   // 2: (unused)
    '#1a3355',   // 3: screen dark
    '#2a6699',   // 4: screen light (glow)
    '#cc4444',   // 5: button red
    '#e86b6b',   // 6: cabinet right face (shadow)
    '#3a3a5a',   // 7: (unused)
    '#3d3d6a',   // 8: cabinet left face (lit)
    '#4d4d8a',   // 9: cabinet top/front mid
    '#1a1a30',   // a: leg shadow
    '#2d2d50',   // b: panel detail
    '#44cc44',   // c: button green panel
    '#ff6644',   // d: button orange
    '#e8c84a',   // e: coin slot
  ],
  tileW: 1,
  tileH: 1,
};

// ============ NEW DECOR ============

export const jukeboxSprite = {
  grid: p([
    '....111111111....',
    '...18899999886a..',
    '..1889999999886a.',
    '..188999aa99886a.',
    '..188999aa99886a.',
    '..188899999886a..',
    '..18888888888b6a.',
    '..188cccccc886a..',
    '..188cddddcb86a..',
    '..188cddddcb86a..',
    '..188cccccc886a..',
    '..18888888888b6a.',
    '..188eeeee8886a..',
    '..188efffe8b86a..',
    '..188eeeee8886a..',
    '..188888888886a..',
    '..1111111111116a.',
    '..1a.........1a..',
    '..11b........11b.',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#6a2020',   // 2: (unused)
    '#8b2a2a',   // 3: (unused)
    '#a03838',   // 4: (unused)
    '#b84848',   // 5: (unused)
    '#5a1818',   // 6: right face (shadow)
    '#7a2a2a',   // 7: (unused)
    '#8b3a3a',   // 8: cabinet left face (lit)
    '#cc5555',   // 9: top window (warm glow)
    '#ff8888',   // a: window brightest
    '#6a2828',   // b: panel shadow
    '#e8c84a',   // c: gold trim
    '#fff8a0',   // d: gold highlight
    '#4a3a6a',   // e: speaker grille
    '#7a6a9a',   // f: speaker highlight
  ],
  tileW: 1,
  tileH: 1,
};

export const tvSprite = {
  grid: p([
    '.....................',
    '..11111111111111111..',
    '.1888888888888888861.',
    '.188777777777777886a.',
    '.18879c999c999c7886a.',
    '.1887999a9aa99c7886a.',
    '.1887c9999aa99c7886a.',
    '.18879c9999999c7886a.',
    '.188777777777777886a.',
    '.1888888888888888861.',
    '.11111111111111111161',
    '........15551........',
    '.....1555555556a.....',
    '.....1155556aa11.....',
    '......1bbb1bb........',
  ]),
  palette: [
    'transparent',
    '#1a1a2e',   // 1: bezel outline
    '#2a2a40',   // 2: (unused)
    '#3a3a50',   // 3: (unused)
    '#4a4a60',   // 4: (unused)
    '#404060',   // 5: stand base
    '#222240',   // 6: right face (shadow)
    '#1a2a3a',   // 7: screen edge
    '#3d3d6a',   // 8: bezel left (lit)
    '#4a7aaa',   // 9: screen (blue tint)
    '#70aadd',   // a: screen highlight/reflection
    '#0e0e1a',   // b: drop shadow
    '#3a6090',   // c: screen content dark
  ],
  tileW: 1,
  tileH: 1,
};

export const plantSprite = {
  grid: p([
    '........11........',
    '......11c8311.....',
    '.....11c833c11....',
    '...11c83388c3311..',
    '..1c833388338831..',
    '..1883c388c3883...',
    '...18833c83381....',
    '....118833811.....',
    '.....118831.......',
    '......1881........',
    '.....177771.......',
    '....1799997a1.....',
    '....1799997a1.....',
    '....179999a61.....',
    '.....17aaa61......',
    '......11111.......',
    '.......1b1........',
  ]),
  palette: [
    'transparent',
    '#1a3a1a',   // 1: dark green outline
    '#2a5a2a',   // 2: (unused)
    '#2a6a2a',   // 3: leaf dark (shadow side)
    '#3a8a3a',   // 4: (unused)
    '#50a050',   // 5: (unused)
    '#5a3020',   // 6: pot shadow right
    '#8b5e3c',   // 7: pot left face (lit)
    '#55aa55',   // 8: leaf bright (lit)
    '#a07850',   // 9: pot top face (brightest)
    '#6a4028',   // a: pot right face (shadow)
    '#1a0e06',   // b: drop shadow
    '#78cc78',   // c: leaf highlight (bright green)
  ],
  tileW: 1,
  tileH: 1,
};

export const rugSprite = {
  grid: p([
    '.......................................',
    '..11111111111111111111111111111111111..',
    '.1777777777777777777777777777777777761.',
    '.178888888888888888888888888888888876a.',
    '.17899999999999999999999999999999987a1.',
    '.17899999999999999999999999999999876a..',
    '.17888888888888888888888888888888876a..',
    '.16666666666666666666666666666666661...',
    '..1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1....',
    '..11111111111111111111111111111111.....',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#5a1a1a',   // 2: (unused)
    '#6a2020',   // 3: (unused)
    '#7a2a2a',   // 4: (unused)
    '#8a3030',   // 5: (unused)
    '#6a2a2a',   // 6: left edge (lit side)
    '#8b3a3a',   // 7: top surface left
    '#a34a4a',   // 8: top surface middle
    '#c06060',   // 9: top surface bright center
    '#4a1a1a',   // a: right/bottom edge (shadow)
  ],
  tileW: 2,
  tileH: 1,
};

export const ceilinglightSprite = {
  grid: p([
    '.....111.......',
    '.....151.......',
    '.....151.......',
    '....15551......',
    '...1577751.....',
    '..157888875a1..',
    '.15789998a75a1.',
    '.157899a8a75a1.',
    '..1578a8a75a1..',
    '...157775a1....',
    '....11111......',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: outline
    '#4a4a4a',   // 2: (unused)
    '#6a6a6a',   // 3: (unused)
    '#808080',   // 4: (unused)
    '#555555',   // 5: chain/fixture metal
    '#3a3a3a',   // 6: (unused)
    '#e8c84a',   // 7: shade left (lit)
    '#fff8a0',   // 8: shade top/bright
    '#ffffe0',   // 9: glow center (brightest)
    '#c0a030',   // a: shade right (shadow)
  ],
  tileW: 1,
  tileH: 1,
};

export const bookcaseSprite = {
  grid: p([
    '..111111111111111111.',
    '.18999999999999998a1.',
    '.189999999999999986a.',
    '.18339422c556228986a.',
    '.1833d422c556e28986a.',
    '.183394228556228986a.',
    '.189999999999999986a.',
    '.111111111111111116a.',
    '.189999999999999986a.',
    '.18266e2887722c9986a.',
    '.182662d88772289986a.',
    '.182662288772289986a.',
    '.189999999999999986a.',
    '.111111111111111116a.',
    '.189999999999999986a.',
    '.1855322c6442289986a.',
    '.185532266d42e89986a.',
    '.185532266442289986a.',
    '.189999999999999986a.',
    '.111111111111111116a.',
    '.1a...............1a.',
    '.1a...............1a.',
    '.11b.............11b.',
  ]),
  palette: [
    'transparent',
    '#2a1a0e',   // 1: frame outline
    '#44aa66',   // 2: book green
    '#4488cc',   // 3: book blue
    '#3366aa',   // 4: book blue dark
    '#cc4444',   // 5: book red
    '#ddaa44',   // 6: book gold
    '#bb8822',   // 7: book gold dark
    '#4a3020',   // 8: shelf shadow right face
    '#8b6a40',   // 9: shelf wood left face (lit)
    '#6a4a2a',   // a: right panel (shadow)
    '#1a0e06',   // b: drop shadow
    '#9a5588',   // c: book purple
    '#3388aa',   // d: book teal spine highlight
    '#f0c060',   // e: book gold highlight
  ],
  tileW: 1,
  tileH: 1,
};

// ============ ANIMATED ============

export const dogSprite = {
  frames: [
    // Frame 1: idle sitting, tail down — 3D with shaded fur
    p([
      '................',
      '.....11111......',
      '....17d8871.....',
      '...1788d8871....',
      '...178a88a71....',
      '...1788d8871....',
      '....1788871.....',
      '....1788871.....',
      '...17d888761....',
      '...178d88761....',
      '...17888d8761...',
      '...178888761....',
      '....1766661.....',
      '....16.66.61....',
      '.....1b.1b......',
    ]),
    // Frame 2: idle sitting, tail up (wagging)
    p([
      '................',
      '.....11111......',
      '....17d8871.....',
      '...1788d8871....',
      '...178a88a71....',
      '...1788d8871....',
      '....1788871.....',
      '....1788871.....',
      '...17d888761....',
      '...178d88761.1..',
      '...17888d8761...',
      '...178888761....',
      '....1766661.....',
      '....16.66.61....',
      '.....1b.1b......',
    ]),
    // Frame 3: head tilted slightly left
    p([
      '................',
      '....11111.......',
      '...17d8871......',
      '..1788d8871.....',
      '..178a88a71.....',
      '..1788d8871.....',
      '...1788871......',
      '....1788871.....',
      '...17d888761....',
      '...178d88761....',
      '...17888d8761...',
      '...178888761....',
      '....1766661.....',
      '....16.66.61....',
      '.....1b.1b......',
    ]),
    // Frame 4: mouth open (panting), tongue out
    p([
      '................',
      '.....11111......',
      '....17d8871.....',
      '...1788d8871....',
      '...178a88a71....',
      '...1788d8871....',
      '....178c871.....',
      '....178c71......',
      '...17d888761....',
      '...178d88761....',
      '...17888d8761...',
      '...178888761....',
      '....1766661.....',
      '....16.66.61....',
      '.....1b.1b......',
    ]),
  ],
  palette: [
    'transparent',
    '#3b2510',   // 1: dark brown outline
    '#9a7030',   // 2: (unused)
    '#b88840',   // 3: (unused)
    '#d0a050',   // 4: (unused)
    '#e8b868',   // 5: (unused)
    '#8a6028',   // 6: paw/bottom shadow
    '#c8923a',   // 7: fur left face (lit)
    '#dbb062',   // 8: fur top/highlight
    '#f0cc88',   // 9: (unused)
    '#1a1008',   // a: dark nose / eyes
    '#1a0e06',   // b: drop shadow
    '#e87e8a',   // c: pink tongue
    '#eec878',   // d: fur highlight patches
  ],
  tileW: 1,
  tileH: 1,
};

export const cactusSprite = {
  frames: [
    // Frame 1: normal position — 3D shaded cactus
    p([
      '...............',
      '......11.......',
      '.....1871......',
      '.....1871......',
      '.....1871......',
      '..11.1871......',
      '.1871871.......',
      '.1871871.......',
      '.1871871.......',
      '..187871.......',
      '....1861.......',
      '....1861.......',
      '....1861.......',
      '.....11........',
      '....1aa1.......',
      '...1abba61.....',
      '...1abba61.....',
      '....1661.......',
      '.....1c1.......',
    ]),
    // Frame 2: very slight lean left (1px shift on top)
    p([
      '...............',
      '.....11........',
      '....1871.......',
      '....1871.......',
      '....1871.......',
      '..11.1871......',
      '.1871871.......',
      '.1871871.......',
      '.1871871.......',
      '..187871.......',
      '....1861.......',
      '....1861.......',
      '....1861.......',
      '.....11........',
      '....1aa1.......',
      '...1abba61.....',
      '...1abba61.....',
      '....1661.......',
      '.....1c1.......',
    ]),
    // Frame 3: flower bloomed on top
    p([
      '.....d9d1......',
      '....d9ed1......',
      '....1dd1.......',
      '.....1871......',
      '.....1871......',
      '..11.1871......',
      '.1871871.......',
      '.1871871.......',
      '.1871871.......',
      '..187871.......',
      '....1861.......',
      '....1861.......',
      '....1861.......',
      '.....11........',
      '....1aa1.......',
      '...1abba61.....',
      '...1abba61.....',
      '....1661.......',
      '.....1c1.......',
    ]),
  ],
  palette: [
    'transparent',
    '#1a4a1a',   // 1: dark green outline
    '#2a6a2a',   // 2: (unused)
    '#3a8a3a',   // 3: (unused)
    '#50a050',   // 4: (unused)
    '#60b860',   // 5: (unused)
    '#184018',   // 6: right face shadow
    '#2d8a2d',   // 7: left face (lit)
    '#5abf5a',   // 8: top / front highlight
    '#e86b8a',   // 9: pink flower petals
    '#8b5e3c',   // a: pot left face (lit)
    '#a07850',   // b: pot top (brightest)
    '#1a0e06',   // c: drop shadow
    '#f0a0b8',   // d: flower petal light
    '#f0c848',   // e: flower center bright
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
  jukebox: jukeboxSprite,
  tv: tvSprite,
  plant: plantSprite,
  rug: rugSprite,
  ceilinglight: ceilinglightSprite,
  bookcase: bookcaseSprite,
  dog: dogSprite,
  cactus: cactusSprite,
};
