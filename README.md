# Sidequest

**The place your party hangs out between matches.**

Sidequest is a gamer-first social voice app built around customizable hangout rooms. Instead of abstract voice channels, your squad gets a room — place furniture, pick your seat, and hang out with spatial voice chat.

## Download

**[Sidequest v0.3.0 — Windows Installer](https://github.com/Calum136/AudioChat/releases/tag/v0.3.0)**

The app auto-updates after install, so you'll always get the latest version.

## Features

- **Isometric pixel art rooms** — Habbo Hotel-inspired with 4 themed layouts (Gaming Den, Sci-Fi Lounge, Fantasy Tavern, Retro Arcade)
- **Spatial voice chat** — powered by LiveKit, with positional audio based on seating
- **Furniture placement** — drag-and-drop furniture from a palette in edit mode
- **Seat-based voice** — couches, barstools, bean bags, gaming chairs all create voice seats
- **Friends system** — add friends, see who's online, knock to join their room
- **Room persistence** — rooms you create or join are saved for easy rejoin
- **Admin roles** — room owners can promote admins who can also edit the room
- **Pixel avatars** — customizable avatar with color picker for hair, skin, shirt, pants
- **Listen-only & AFK seats** — special furniture types for passive listening or going AFK
- **Desktop app** — Electron wrapper with auto-update via GitHub Releases

## Running Locally

```bash
npm install
npm run dev          # Web (Vite dev server)
npm run electron:dev # Desktop (Electron + Vite + backend)
```

Open [http://localhost:5173](http://localhost:5173) for the web version.

### Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

## Tech Stack

| Choice | Why |
|--------|-----|
| React 19 + Vite 6 | Fast modern dev with HMR |
| Zustand | Minimal state management |
| Custom CSS | Full control for spatial room UI, no Tailwind |
| Supabase | Auth, Postgres DB, Realtime (Presence + Broadcast) |
| LiveKit | WebRTC SFU for voice chat with spatial audio |
| Electron | Desktop app with auto-update |
| Pixel art sprites | Canvas-rendered from palette-indexed grids |

## Building the Desktop App

```bash
npm run electron:build
```

Output: `release-v3/Sidequest Setup X.X.X.exe` (Windows NSIS installer)

## Docs

- [Product Brief](docs/product-brief.md) — problem, audience, core mechanic, MVP scope
