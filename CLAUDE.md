# Sidequest
# Last updated: Mar 18, 2026

## Status: ACTIVE - Voice chat working via LiveKit Cloud. Spatial audio, mute/unmute, speaking indicators all functional.
## Completion: ~15%

## What It Is
Cozy multiplayer rooms with voice chat. Users build custom rooms, drag in furniture, and invite friends to sit and hang out in a premium gamer-aesthetic space. Think Discord stage channels meets Habbo Hotel — but with a room editor and spatial seating logic.

## Tech Stack
- **Frontend:** React 19, Vite, Zustand, custom CSS (no Tailwind)
- **State:** Zustand (roomStore.js manages furniture, occupants, themes, friend list)
- **Icons:** SVG line icon system (placeholder for future pixel art assets)
- **Backend (preserved):** Old AudioChat Express + Socket.io server in `server/` — not currently wired to frontend
- **Voice (planned):** LiveKit or mediasoup
- **Persistence (planned):** Supabase
- **Multiplayer sync (planned):** Socket.io or LiveKit data channels

## Design Direction
- Dark gamer aesthetic — cozy but premium
- SVG line icons throughout (no emojis in UI)
- Grid layouts not lists (palette uses 2-column grid)
- Theme picker uses color swatches
- Furniture-based seating: click a seat on a placed furniture item to sit/stand
- No Tailwind — all styles are custom CSS with CSS variables

## Key Files
- `src/stores/roomStore.js` — Central Zustand store (furniture catalog, drag logic, occupants, themes)
- `src/data/furniture.js` — Furniture catalog (types, seat configs, SVG icons)
- `src/components/` — All UI components (RoomView, Palette, FurnitureItem, FriendList, etc.)
- `src/App.jsx` — App shell and routing
- `src/main.jsx` — Entry point
- `vite.config.js` — Vite config
- `docs/product-brief.md` — Full product vision and feature spec
- `server/` — Old AudioChat backend (Express, Socket.io, auth, REST API) — preserved, not active

## Project Location
`C:\Projects\AudioChat\` (directory name not yet renamed from original AudioChat project)

## Next Steps
- [ ] Pixel art / uploaded image assets for furniture (replace SVG placeholders)
- [ ] Real voice integration (LiveKit or mediasoup)
- [ ] Persistence layer (Supabase — rooms, furniture layouts, user profiles)
- [ ] Multiplayer room sync (Socket.io or LiveKit data channels)
- [ ] Rename project directory from AudioChat → Sidequest

## Session Notes

### Mar 8, 2026 — Pivot + Front-End Prototype
Pivoted AudioChat → Sidequest. Built full front-end prototype: landing page, room view with draggable furniture, furniture-based seating logic (click seats to sit), 4 room themes, SVG line icon system, 2-column palette grid, friend presence panel. Stack: React 19 + Vite + Zustand + custom CSS. Product brief written. Old Express backend preserved in server/. Design feedback applied: replaced all emojis with SVG line icons, converted palette from list to grid, theme picker uses color swatches.

### Mar 9, 2026 — Project Registered in Memory System
Registered Sidequest in root CLAUDE.md and project-memory config. Created project CLAUDE.md. Added AudioChat/sidequest slugs to config.ts and rebuilt dist. Session note from Mar 8 captured above.
- **Mar 18, 2026:** Implemented LiveKit voice chat with spatial audio. Added: token endpoint on Express server, voiceStore (Zustand) managing LiveKit Room lifecycle + Web Audio API spatial processing (StereoPannerNode for L/R pan, GainNode for distance attenuation), useVoiceConnection hook bridging seat state to voice connection, mute/unmute button, speaking glow on seat markers, speaking indicators in friend panel, "Voice" badge in header. Fixed CommonJS/ESM conflict with server/package.json. LiveKit Cloud free tier connected and verified working. Voice connects on sit, disconnects on stand.
