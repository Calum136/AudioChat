# Sidequest — Product Brief

## Problem

Voice chat in gaming is trapped in the Discord paradigm: abstract channel lists, faceless voice rooms, no sense of place. Friend groups have no shared space that feels like theirs — everything is generic, impersonal, utilitarian.

There is no digital equivalent of "hanging out at someone's place."

## Audience

Friend groups of 3–8 gamers who play together regularly. They want a shared hangout between sessions — not a community server for thousands. Think couch co-op energy, not esports teams.

## Core Mechanic

Every voice room is a **customizable digital space** with placed furniture. Each piece of sittable furniture creates voice call seats. Joining a call means entering a room and choosing where to sit.

- A couch = 2 seats
- A bean bag = 1 seat
- A bar stool = 1 seat
- Room capacity = sum of all seats from placed furniture

Users don't just "join a voice channel." They **enter a room** and **pick a seat.**

## Why Not Discord?

| Discord | Sidequest |
|---------|-----------|
| Abstract channel list | Visual, spatial room |
| Voice channel = a name | Voice channel = a place |
| "Join" a channel | "Enter" a room, pick a seat |
| No room customization | Full furniture placement |
| Community-first (servers of thousands) | Friend-group-first (your squad's base) |
| Utility-focused | Vibes-focused |

Discord is infrastructure. Sidequest is a place.

## Emotional Hook

**"This is our place."**

Sidequest gives your friend group a digital home — a cozy, personalized space that's yours. It's the basement, the dorm room, the guild hall. You actually *go there* to hang out.

## MVP Scope

- One customizable room per group
- Draggable furniture placement (edit mode)
- Furniture-based seat logic (each sittable item = voice seats)
- Friend presence (who's here, where they're sitting)
- 4 room themes (Gaming Den, Sci-Fi Lounge, Fantasy Tavern, Retro Arcade)
- ~11 furniture items (6 seating, 5 decor)
- Mock voice state (presence only — no real audio yet)

## Monetization Direction

- Furniture packs (themed sets)
- Room themes and skins
- Premium decor items
- Layout templates
- Hosting upgrades (more rooms, more seats)

**Constraint:** The free tier must feel complete and fun. No pay-to-socialize mechanics.

## Tech Stack Rationale

| Choice | Why |
|--------|-----|
| React + Vite | Fast dev, HMR, modern DX |
| Zustand | Minimal state management — no boilerplate |
| Custom CSS | Full control for spatial room UI — no framework overhead |
| Mocked data | Unblocked by backend — prototype the concept first |
| No Tailwind | Room mechanics need custom spatial CSS, not utility classes |

Future additions: real voice via LiveKit/mediasoup, persistence via Supabase/Postgres, multiplayer sync via WebSockets.
