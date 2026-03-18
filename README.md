# Sidequest

**The place your party hangs out between matches.**

Sidequest is a gamer-first social voice app built around a customizable hangout base. Instead of abstract voice channels, your squad gets a room — place furniture, pick your seat, and hang out.

## Concept

- Voice call seats are determined by furniture in the room
- A couch = 2 seats. A bean bag = 1 seat. A bar stool = 1 seat.
- Joining voice means entering a room and choosing where to sit
- Rooms are customizable with themes, furniture, and decor
- Built for friend groups of 3–8, not giant communities

## Running the Prototype

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## What This Prototype Shows

- **Landing page** — introduces the concept and brand
- **Room view** — the core product: a visual room with placed furniture
- **Furniture placement** — toggle edit mode, drag furniture from the palette
- **Seat markers** — each seating item shows available seats (teal dots)
- **Friend presence** — mock friends seated in the room
- **Seat selection** — click an available seat to sit down, click again to stand
- **Room themes** — switch between 4 visual themes (Gaming Den, Sci-Fi, Tavern, Arcade)
- **3-panel layout** — palette (edit mode), room (center), friends (right)

## Tech Stack

| Choice | Why |
|--------|-----|
| React 19 + Vite | Fast modern dev with HMR |
| Zustand | Minimal state — no boilerplate |
| Custom CSS | Full control for spatial room UI |
| Mocked data | No backend needed to demo the concept |

## Project Structure

```
src/
├── main.jsx               Entry point
├── App.jsx                 View routing (landing / room)
├── index.css               All styles — dark gamer aesthetic
├── stores/
│   └── roomStore.js        Zustand store (room, furniture, seating)
├── data/
│   ├── furniture.js        Furniture catalog (types, sizes, seats)
│   ├── themes.js           Room theme definitions
│   └── friends.js          Mock friend data
└── components/
    ├── Landing.jsx          Landing / intro page
    ├── AppShell.jsx         App layout (header + 3-panel body)
    ├── Room.jsx             Room view (drop zone, furniture rendering)
    ├── FurnitureItem.jsx    Draggable furniture piece with seats
    ├── SeatMarker.jsx       Seat indicator (available / occupied)
    ├── Palette.jsx          Furniture palette (left panel, edit mode)
    ├── FriendPanel.jsx      Friend list (right panel)
    └── ThemePicker.jsx      Theme switcher

docs/
└── product-brief.md         Internal product brief

server/                      Original AudioChat backend (preserved)
```

## Docs

- [Product Brief](docs/product-brief.md) — problem, audience, core mechanic, MVP scope

## Next Steps (Not In Prototype)

- Real voice integration (LiveKit / mediasoup)
- User auth and persistence (Supabase / Postgres)
- Multiplayer room sync (WebSocket state)
- Furniture animations and interaction sounds
- Mobile-responsive layout
- Creator marketplace for furniture / themes
