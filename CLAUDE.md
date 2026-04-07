# Sidequest
# Last updated: Apr 5, 2026

## Status: ACTIVE - Low/mid priority. Front-end prototype complete. Not being actively sprinted on but still in play.
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
- `src/stores/authStore.js` — Auth state (signUp, signIn, signOut, fetchProfile, updateAvatar, updateDisplayName, updatePassword, updateEmail, deleteAccount)
- `src/stores/voiceStore.js` — LiveKit voice (connect, disconnect, spatial audio, speaking detection)
- `src/lib/supabase.js` — Supabase client singleton
- `src/lib/roomService.js` — DB query wrappers (rooms, furniture CRUD)
- `src/lib/roomChannel.js` — Realtime channel setup (Presence + Broadcast)
- `src/hooks/useVoiceConnection.js` — Bridges seating state to voice connection
- `src/components/AuthForm.jsx` — Sign in / sign up UI
- `src/components/SettingsPage.jsx` — Settings modal (Account, Avatar, Appearance tabs)
- `src/components/AvatarEditor.jsx` — Pixel avatar editor with live preview + Supabase save
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
- `src/stores/friendStore.js` — Friends state (friend list, presence, search, mute)
- `src/lib/friendService.js` — DB query wrappers for friendships table
- `src/components/FriendsPanel.jsx` — Friends list UI (search, add, block, mute, status)
- `src/components/SocialPanel.jsx` — Tab wrapper (Room + Friends) for in-room sidebar
- `src/components/ConfirmDialog.jsx` — Reusable confirmation modal
- `src/stores/audioSettingsStore.js` — Audio settings persistence (master/sfx/voice/mic volumes)
- `server/server.js` — Express server (LiveKit token endpoint)
- `electron/main.js` — Electron main process (desktop app wrapper)
- `electron/preload.js` — Electron preload script (context bridge)
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
- [x] ~~Verify Netlify auto-deploy from GitHub~~ — connected, env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LIVEKIT_URL) added to dashboard
- [ ] Test real-time furniture/theme sync between two users
- [x] ~~Pixel art + isometric grid system~~ — 11 furniture sprites, 4 floor themes, pixel avatars, Habbo-style diamond grid
- [x] ~~BUG: Sitting feature broken~~ — fixed (click event propagated from SeatMarker to Room, moveAvatar overwrote sitDown)
- [x] ~~Click-to-copy join codes~~ — join codes in room cards now copy to clipboard on click
- [x] ~~Auto-zoom room to fit viewport~~ — room auto-scales based on browser window size
- [x] ~~Dashboard vibe redesign~~ — game-menu style with tile grid, compact quick-bar, removed corporate cards/badges
- [x] ~~Friends system~~ — full friends list with add/remove/block/mute, online presence, "in your room" indicator, search users
- [x] ~~Delete confirmation dialog~~ — replaced confusing "?" with proper ConfirmDialog modal
- [x] ~~Room deletion RLS~~ — migration 003 exists, needs to be applied via Supabase SQL Editor
- [ ] PENDING: Apply migration 004_friendships.sql to Supabase (run SQL in dashboard)
- [ ] PENDING: Apply migration 003_room_delete_policy.sql if not already applied
- [x] ~~BUG: Furniture can be deleted in edit mode, deleting players sitting in chairs~~ — fixed (hide X on occupied furniture)
- [x] ~~BUG: Voice breaks when switching chairs~~ — fixed (debounced disconnect for chair-to-chair transitions)
- [x] ~~Avatar models randomly change between users~~ — fixed (avatar config now sent in presence data)
- [x] ~~Audio settings~~ — Audio tab in Settings with master/sfx/voice/mic volume controls
- [x] ~~Listen-only areas~~ — listen seat type auto-mutes mic, AFK seat type mutes + deafens
- [x] ~~Electron desktop app~~ — `npm run electron:dev` / `npm run electron:build` for desktop exe
- [x] ~~Voice: echo cancellation~~ — added echoCancellation to LiveKit audioCaptureDefaults
- [x] ~~Voice: mic input volume control~~ — wired audioSettingsStore.micInputVolume to Web Audio GainNode on outgoing mic
- [x] ~~Voice: connection error recovery~~ — retry up to 3x with exponential backoff, error badge in header
- [x] ~~Voice: talk while standing~~ — voice connects on room entry, not just when sitting. Standing users have spatial audio too
- [x] ~~Themed room shapes~~ — each theme has unique floor layout: gaming-den 8x8 square, scifi-lounge 10x8 spaceship, fantasy-tavern 10x8 L-shape, retro-arcade 9x9 cross. Shape masks, dynamic grid dimensions, themed backgrounds (starfield for sci-fi, neon grid for arcade)
- [ ] BUG: Furniture cannot be added from palette (existing bug, not yet fixed)
- [ ] Email rate limiting causing issues — investigate custom SMTP or Supabase plan upgrade
- [ ] Test isometric room with real multiplayer (sign in, create room, place furniture, verify grid)
- [ ] PENDING: Apply migration 005_avatar_columns.sql to Supabase (run SQL in dashboard)
- [ ] Avatar as profile pic — use pixel avatar everywhere (friend list, room presence, header) instead of color circle with initial
- [ ] Spotify "Listen Along" integration — DJ controls playback, syncs via Supabase Broadcast, each user plays on own Spotify account
- [ ] Gaming Den LED light switch (owner-toggleable wall glow)
- [ ] Furniture animation frames (idle bobble, placement bounce)
- [ ] Avatar animation (idle breathing, walk cycle for future movement)
- [ ] User-uploaded custom furniture sprites (PNG upload → sprite pipeline)
- [ ] More furniture variety (bed, TV, bookcase, rug, plant, window, door)
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
- **Mar 20, 2026:** Deployed pixel art update to Netlify production. Fixed Netlify auto-deploy: added VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LIVEKIT_URL env vars to Netlify dashboard (all public client-side keys, not secrets). Continuous deployment from GitHub now working. Isometric grid, furniture sprites, and room rendering verified working on production. Known bug: furniture can be deleted in edit mode but cannot be added from the palette.
- **Mar 26, 2026:** Bug fixes from friend testing session. (1) Sitting feature fixed — SeatMarker click was bubbling to Room's click handler, which called moveAvatar with stale presence data (null seat), overwriting the sitDown. Added e.stopPropagation() to SeatMarker.handleClick. (2) Click-to-copy join codes — room cards now copy join code to clipboard on click with "Copied!" feedback. (3) Auto-zoom — room now auto-scales to fit the browser viewport on load and window resize, calculated from room pixel dimensions vs container size. (4) Dashboard redesign — replaced corporate card/badge layout with game-menu style: single-column layout, compact quick-bar with create/join tabs, tile grid for rooms with theme icons and accent glows, cleaner empty state. Removed feature badges and info panel. (5) Captured email rate limit issue to Open Brain — Supabase free tier rate limits causing problems, need to investigate custom SMTP or plan upgrade.
- **Mar 26, 2026:** Friends system implemented. New DB table: friendships (pending/accepted/blocked status, blocked_by tracking). New files: friendService.js (CRUD wrappers), friendStore.js (Zustand — friends list, global presence via supabase.channel('presence:global'), search, mute), FriendsPanel.jsx (search users, add/accept/decline requests, online/offline status, "in your room" indicator, context menu with mute/block/remove), SocialPanel.jsx (tab wrapper — Room + Friends tabs for in-room sidebar), ConfirmDialog.jsx (reusable glassmorphic modal). Room deletion now uses proper ConfirmDialog instead of confusing "?" two-click pattern. Mute integrated into voiceStore — muted users get gain=0 in spatial audio pipeline. Friends panel appears as sidebar on landing dashboard and as "Friends" tab in room. 4 new SVG icons (userPlus, dots, search, block). Migration 004_friendships.sql created — needs to be applied to Supabase. Build compiles clean.
- **Mar 28, 2026:** Major UI + feature update. (1) Fixed loading stuck forever bug — authStore.initialize() now wraps fetchProfile in try/catch so loading always clears. (2) Friends UI — blocked friends now subdued (35% opacity), dots menu button enlarged (28px). Fixed button-in-button nesting warning in RoomCard (changed outer to div). (3) Avatar editor — new AvatarEditor.jsx component with live pixel art preview, 5 color pickers (hair, skin, shirt, pants, background), saves to Supabase via new avatar columns. Migration 005_avatar_columns.sql adds avatar_hair/skin/shirt/pants/bg to profiles. Updated getAvatarPalette() to accept avatar config object. (4) Settings page — new SettingsPage.jsx modal with sidebar nav (Account/Avatar/Appearance tabs). Account: edit display name, change email, change password, sign out, delete account. Avatar: full avatar editor. Appearance: reduced motion toggle + UI scale selector (localStorage-persisted). (5) Updated CLAUDE.md with detailed room shape specs and avatar-as-profile-pic todo. (6) Created UI mockup (docs/mockup-main-page.html) showing design direction with cursor glow, 3D tilt cards, particles, aurora background, activity feed.
- **Mar 29, 2026:** Friend testing feedback batch. (1) Electron desktop app — electron/main.js + preload.js, package.json updated with electron:dev/electron:build scripts, electron-builder config for Windows NSIS installer. (2) Avatar persistence bug fixed — avatar config (hair/skin/shirt/pants/bg) now included in Supabase Realtime Presence data, so other users see your actual avatar instead of random hash-generated colors. Fixed in roomStore (all track() calls), SeatMarker, and StandingAvatar. (3) Audio settings — new audioSettingsStore.js with localStorage persistence, Audio tab in SettingsPage with sliders for master/SFX/voice/mic volumes + SFX enable toggle + test button. Sound effects (join/leave/knock) and voice spatial audio all respect volume settings. (4) Can't delete occupied furniture — X button hidden when anyone is sitting on the furniture piece. (5) Voice breaks on chair switch — debounced disconnect by 200ms so chair-to-chair transitions don't trigger disconnect/reconnect cycle. (6) Listen-only seats — new 'listen' seat type auto-mutes mic on sit, mic button locked. New furniture: Listener Couch (2-seat), Listener Cushion. (7) AFK zone — new 'afk' seat type mutes mic AND deafens all incoming audio. New furniture: AFK Bean Bag. Visual: AFK avatars shown at 50% opacity with grayscale, header shows AFK/Listen Only badges. Join/leave sounds already existed from Mar 26.
- **Mar 30, 2026:** Deep dive audit completed (Mar 30). Renamed Sidequest. 25 commits in 12 days (Mar 18-30). Key milestones: multiplayer MVP (Mar 18), pixel art overhaul (Mar 20), friends system (Mar 26), Electron desktop app (Mar 29). Live at sidequest-hangout.netlify.app. Blocking: email rate limiting, 3 pending migrations, furniture palette broken.
- **Apr 5, 2026:** Deep dive audit completed (Mar 30). Renamed Sidequest. 25 commits in 12 days (Mar 18-30). Key milestones: multiplayer MVP (Mar 18), pixel art overhaul (Mar 20), friends system (Mar 26), Electron desktop app (Mar 29). Live at sidequest-hangout.netlify.app. Blocking: email rate limiting, 3 pending migrations, furniture palette broken.
- **Apr 7, 2026:** Voice chat overhaul + themed room shapes. Voice: added echo cancellation, wired mic input volume slider (was dead code), connection error recovery with 3x retry + error badge, voice-while-standing (connects on room entry, spatial audio for standing users). Room shapes: each theme now has unique floor layout — gaming-den 8x8 square, scifi-lounge 10x8 spaceship silhouette (no walls, starfield background), fantasy-tavern 10x8 L-shape with bar section, retro-arcade 9x9 cross (neon grid background). New file: roomShapes.js (shape masks, spawn positions). Parameterized grid dimensions throughout (Room.jsx, FurnitureItem.jsx, wallSprites.js). Collision detection respects shape masks. Spotify "Listen Along" integration scoped for next session.
