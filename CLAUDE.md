# Sidequest
# Last updated: Mar 19, 2026

## Status: ACTIVE - Deployed to Netlify for multiplayer testing. Join-by-code bug fixed.
## Completion: ~30%

## What It Is
Cozy multiplayer rooms with voice chat. Users build custom rooms, drag in furniture, and invite friends to sit and hang out in a premium gamer-aesthetic space. Think Discord stage channels meets Habbo Hotel — but with a room editor and spatial seating logic.

## Tech Stack
- **Frontend:** React 19, Vite 6, Zustand, custom CSS (no Tailwind)
- **State:** Zustand (roomStore, authStore, voiceStore)
- **Icons:** SVG line icon system (placeholder for future pixel art assets)
- **Backend:** Express server for LiveKit token generation (`server/server.js`)
- **Voice:** LiveKit Cloud (WebRTC SFU) + Web Audio API spatial processing
- **Auth:** Supabase Auth (email/password, no email confirmation)
- **Database:** Supabase Postgres (profiles, rooms, furniture tables with RLS)
- **Realtime:** Supabase Realtime (Presence for participants/seating, Broadcast for furniture/theme sync)
- **GitHub:** https://github.com/Calum136/AudioChat

## Design Direction
- Dark gamer aesthetic — cozy but premium
- SVG line icons throughout (no emojis in UI)
- Grid layouts not lists (palette uses 2-column grid)
- Theme picker uses color swatches
- Furniture-based seating: click a seat on a placed furniture item to sit/stand
- No Tailwind — all styles are custom CSS with CSS variables

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
- `src/components/SeatMarker.jsx` — Seat dots / occupant avatars
- `src/data/furniture.js` — Furniture catalog (types, seat configs, SVG icons)
- `server/server.js` — Express server (LiveKit token endpoint)
- `supabase/migrations/` — SQL schema + trigger migrations
- `docs/product-brief.md` — Full product vision and feature spec
- `.env` — All credentials (gitignored)

## Project Location
`C:\Projects\AudioChat\` (directory name not yet renamed from original AudioChat project)

## Next Steps
- [ ] **FIX: Room join-by-code not working** — priority bug
- [ ] Test voice chat with two users in same room
- [ ] Test real-time furniture/theme sync between two users
- [ ] Pixel art / uploaded image assets for furniture (replace SVG placeholders)
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
