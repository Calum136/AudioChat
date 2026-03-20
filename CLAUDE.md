# Sidequest
# Last updated: Mar 20, 2026

## Status: ACTIVE - Pixel art + isometric grid system implemented. Habbo Hotel-style room rendering.
## Completion: ~40%

## What It Is
Cozy multiplayer rooms with voice chat. Users build custom rooms, drag in furniture, and invite friends to sit and hang out in a premium gamer-aesthetic space. Think Discord stage channels meets Habbo Hotel — but with a room editor and spatial seating logic.

## Tech Stack
- **Frontend:** React 19, Vite 6, Zustand, custom CSS (no Tailwind)
- **State:** Zustand (roomStore, authStore, voiceStore)
- **Art:** Pixel art sprite system (canvas-rendered from grid data) + isometric 2:1 grid (64x32 tiles)
- **Icons:** SVG line icons for UI chrome (Icon.jsx), pixel sprites for room furniture/avatars
- **Backend:** Express server for LiveKit token generation (`server/server.js`)
- **Voice:** LiveKit Cloud (WebRTC SFU) + Web Audio API spatial processing
- **Auth:** Supabase Auth (email/password, no email confirmation)
- **Database:** Supabase Postgres (profiles, rooms, furniture tables with RLS)
- **Realtime:** Supabase Realtime (Presence for participants/seating, Broadcast for furniture/theme sync)
- **GitHub:** https://github.com/Calum136/AudioChat

## Design Direction
- **Isometric pixel art** — Habbo Hotel / Knights of Pen and Paper / Webkinz inspired
- Dark gamer aesthetic — cozy but premium
- Pixel art sprites for furniture (canvas-rendered from palette-indexed grids)
- Pixel art avatars with color customization (palette swaps for hair/shirt/skin)
- Isometric 2:1 diamond grid for room layout (8x8 default, snap-to-grid furniture placement)
- 4 themed floor tiles (gaming den, sci-fi, fantasy tavern, retro arcade)
- SVG line icons for UI chrome (header, panels), pixel sprites for room content
- Grid layouts not lists (palette uses 2-column grid)
- Furniture-based seating: click a seat on a placed furniture item to sit/stand
- No Tailwind — all styles are custom CSS with CSS variables
- `image-rendering: pixelated` for crisp sprite scaling

## Key Files
- `src/stores/roomStore.js` — Central store (room lifecycle, furniture CRUD, seating via Presence, theme)
- `src/stores/authStore.js` — Auth state (signUp, signIn, signOut, fetchProfile)
- `src/stores/voiceStore.js` — LiveKit voice (connect, disconnect, spatial audio, speaking detection)
- `src/lib/supabase.js` — Supabase client singleton
- `src/lib/roomService.js` — DB query wrappers (rooms, furniture CRUD)
- `src/lib/roomChannel.js` — Realtime channel setup (Presence + Broadcast)
- `src/hooks/useVoiceConnection.js` — Bridges seating state to voice connection
- `src/components/AuthForm.jsx` — Sign in / sign up UI
- `src/components/Landing.jsx` — Auth + room create/join
- `src/components/AppShell.jsx` — Room header, layout, owner controls
- `src/components/ParticipantPanel.jsx` — Real-time participant list (replaced FriendPanel)
- `src/components/SeatMarker.jsx` — Pixel avatar seats / occupant rendering
- `src/data/furniture.js` — Furniture catalog (types, seat configs, grid footprints)
- `src/data/sprites/furnitureSprites.js` — Pixel art definitions for all 11 furniture items
- `src/data/sprites/floorSprites.js` — Isometric floor tile sprites per theme
- `src/data/sprites/avatarSprites.js` — Pixel avatar templates + palette swap system
- `src/lib/spriteRenderer.js` — Pixel grid → canvas data URL renderer (with cache)
- `src/lib/isoGrid.js` — Isometric math (isoToScreen, screenToIso, depth sorting)
- `server/server.js` — Express server (LiveKit token endpoint)
- `supabase/migrations/` — SQL schema + trigger migrations
- `docs/product-brief.md` — Full product vision and feature spec
- `.env` — All credentials (gitignored)

## Project Location
`C:\Projects\AudioChat\` (directory name not yet renamed from original AudioChat project)

## Next Steps
- [x] ~~FIX: Room join-by-code not working~~ — fixed (ilike + maybeSingle)
- [x] ~~Test voice chat with two users in same room~~ — verified working
- [x] ~~Room persistence between sessions~~ — "My Rooms" grid on landing page
- [x] ~~UI redesign~~ — glassmorphic "Cozy Neon Lounge" aesthetic
- [ ] Verify Netlify auto-deploy from GitHub (needs GitHub App auth via Netlify dashboard)
- [ ] Test real-time furniture/theme sync between two users
- [x] ~~Pixel art + isometric grid system~~ — 11 furniture sprites, 4 floor themes, pixel avatars, Habbo-style diamond grid
- [ ] Test isometric room with real multiplayer (sign in, create room, place furniture, verify grid)
- [ ] Add room walls (back walls of isometric room for visual framing)
- [ ] Furniture animation frames (idle bobble, placement bounce)
- [ ] Avatar animation (idle breathing, walk cycle for future movement)
- [ ] User-uploaded custom furniture sprites (PNG upload → sprite pipeline)
- [ ] More furniture variety (bed, TV, bookcase, rug, plant, window, door)
- [ ] Electron wrapper for downloadable exe (Discord-style desktop app)
- [ ] Rename project directory from AudioChat → Sidequest

## Session Notes

### Mar 8, 2026 — Pivot + Front-End Prototype
Pivoted AudioChat → Sidequest. Built full front-end prototype: landing page, room view with draggable furniture, furniture-based seating logic (click seats to sit), 4 room themes, SVG line icon system, 2-column palette grid, friend presence panel. Stack: React 19 + Vite + Zustand + custom CSS. Product brief written. Old Express backend preserved in server/. Design feedback applied: replaced all emojis with SVG line icons, converted palette from list to grid, theme picker uses color swatches.

### Mar 9, 2026 — Project Registered in Memory System
Registered Sidequest in root CLAUDE.md and project-memory config. Created project CLAUDE.md. Added AudioChat/sidequest slugs to config.ts and rebuilt dist. Session note from Mar 8 captured above.
- **Mar 18, 2026:** Implemented LiveKit voice chat with spatial audio. Added: token endpoint on Express server, voiceStore (Zustand) managing LiveKit Room lifecycle + Web Audio API spatial processing (StereoPannerNode for L/R pan, GainNode for distance attenuation), useVoiceConnection hook bridging seat state to voice connection, mute/unmute button, speaking glow on seat markers, speaking indicators in friend panel, "Voice" badge in header. Fixed CommonJS/ESM conflict with server/package.json. LiveKit Cloud free tier connected and verified working. Voice connects on sit, disconnects on stand.
- **Mar 18, 2026:** Multiplayer MVP code complete and tested. Auth (email/password via Supabase), room creation with join codes, furniture persistence, Realtime Presence (participants), Realtime Broadcast (furniture/theme sync), and seating all verified working. Fixed RLS issue with profile creation by adding DB trigger (002_profile_trigger.sql). Had to disable email confirmation and manually create first user due to rate limiting. Pushed all code to GitHub (Calum136/AudioChat). Old FriendPanel replaced by ParticipantPanel using real Presence data. Voice connection updated to use real user UUIDs.
- **Mar 18, 2026:** Completed multiplayer MVP implementation: AuthForm component, auth-aware App.jsx routing, Landing.jsx with create/join room UI, major roomStore refactor (Supabase persistence + Realtime Presence/Broadcast), ParticipantPanel replacing FriendPanel, SeatMarker using real user IDs, useVoiceConnection with real UUIDs, full CSS for auth/room UI. Fixed profile creation RLS issue with DB trigger (002_profile_trigger.sql). Had to disable email confirmation and manually create first user due to rate limits. All code pushed to GitHub (Calum136/AudioChat). Auth + room creation + furniture + seating all verified working. Room join-by-code NOT working yet — pinned as priority for next session.
- **Mar 19, 2026:** Fixed join-by-code bug: `.single()` → `.maybeSingle()` in getRoomByJoinCode() — was throwing Supabase error instead of returning null when no room found. Deployed to Netlify (https://sidequest-hangout.netlify.app) with Netlify Function for LiveKit token endpoint. Env vars set for LIVEKIT_API_KEY and LIVEKIT_API_SECRET. Ready for multiplayer testing across the internet.
- **Mar 19, 2026:** Major update shipped and verified working with real multiplayer testing. Three fixes: (1) Room persistence — added "My Rooms" section with getUserRooms() query, rooms now survive between sessions and users can rejoin with one click. (2) Join-by-code fix — switched to case-insensitive ilike() match, added better error messages and loading spinners. (3) Full UI redesign — "Cozy Neon Lounge" aesthetic with animated aurora background, glassmorphic panels (backdrop-filter blur), bento grid room cards with theme-colored accent stripes, micro-interactions (staggered fade-ups, hover lifts, neon glow system), refined purple/teal color palette replacing old gold-primary scheme. Deployed to Netlify via CLI (auto-deploy from GitHub not yet connected — needs GitHub App authorization via Netlify dashboard). All features verified working: room persistence, join codes, voice chat with spatial audio. Live at https://sidequest-hangout.netlify.app
- **Mar 20, 2026:** Implemented pixel art + isometric grid system — the big visual overhaul from SVG line icons to Habbo Hotel-style pixel art. Created: spriteRenderer.js (pixel grid → canvas data URL with caching), isoGrid.js (2:1 isometric projection math), 11 furniture pixel sprites in isometric perspective, 4 themed floor tiles (gaming den, sci-fi, fantasy tavern, retro arcade), pixel avatar system with palette swaps for hair/shirt/skin customization. Updated Room.jsx to render 8x8 isometric diamond grid with depth-sorted furniture, FurnitureItem.jsx for sprite rendering + grid-based drag, SeatMarker.jsx for pixel avatar seated characters, Palette.jsx with sprite thumbnails. Furniture positions now use grid coordinates (0-7) instead of pixel coords, with backward-compat migration for existing DB data. All sprites verified rendering correctly via test page. Build compiles clean.
