# Sidequest Codebase Audit — Handoff Document

**Date:** 2026-04-21
**Scope:** Full read-only audit — security, bugs, dead code, incomplete features, code quality
**Purpose:** Exhaustive catalog for a future Claude Code session to work through

---

## HOW TO USE THIS DOCUMENT

Each finding has: **ID**, **file path(s)**, **severity**, **description**, and **fix direction**. Severity scale: **CRITICAL / HIGH / MEDIUM / LOW**. Items are grouped by category. The "Priority Order" section at the end is a suggested execution plan.

---

## SECTION 0 — IMMEDIATE BLOCKERS (Do these first)

| ID | Issue | Severity |
|----|-------|----------|
| B1 | **Secrets committed to `.env` in the repo** — rotate LiveKit key/secret, Supabase anon key, Supabase **service role key**, DB password | CRITICAL |
| B2 | **LiveKit token endpoint has no auth** — anyone can mint a token for any room as any identity | CRITICAL |
| B3 | **Duplicate migration prefix `007`** (`007_avatar_url.sql` + `007_room_image.sql`) — will cause apply-order chaos | CRITICAL |
| B4 | **Pending migrations 004, 005, 006 not applied** — friends, avatar persistence, admin roles silently broken for real users | HIGH |
| B5 | **Supabase Storage buckets `avatars` and `room-images` need to be created** — referenced in migrations 007 but bucket creation is manual | HIGH |
| B6 | **Known bug: furniture cannot be added from palette** — confirmed in code (see BUG-2) | HIGH |

---

## SECTION 1 — SECURITY

### 1.1 Secret/Credential Exposure
- **SEC-1 (CRITICAL):** `.env` contains `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`. Service role key is server-only and grants full DB takeover. **Action: rotate all, remove from git history (`git filter-repo` or BFG), ensure `.env` in `.gitignore`.**
- **SEC-2 (HIGH):** `SUPABASE_SERVICE_ROLE_KEY` must NEVER touch the client. Verify no `VITE_` prefix ever gets added to it.

### 1.2 Auth on API Endpoints
- **SEC-3 (CRITICAL):** `server/server.js:39-55` and `netlify/functions/livekit-token.mjs` — LiveKit token endpoints accept any `roomName` and `identity` without verifying the caller. **Fix: require a Supabase access token in header, validate via `supabase.auth.getUser(token)`, then derive identity server-side — never trust client-provided identity.**
- **SEC-4 (MEDIUM):** Endpoint should also validate the caller has access to the requested room.

### 1.3 Supabase RLS
- **SEC-5 (HIGH):** `001_initial_schema.sql:14-17` — `profiles` SELECT policy is `USING (true)`. Any authenticated user can enumerate all profiles. **Fix: restrict to self or friends/room-mates.**
- **SEC-6 (HIGH):** `001_initial_schema.sql:42-45` — `rooms` SELECT policy is `USING (true)`. Exposes all private rooms including join codes. **Fix: restrict to `owner_id = auth.uid() OR id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())`.**
- **SEC-7 (HIGH):** `001_initial_schema.sql:70-73` — `furniture` SELECT policy is `USING (true)`. Same fix pattern as rooms.
- **SEC-8 (HIGH):** `007_room_image.sql:8-27` — storage policy allows any authenticated user to upload/overwrite/delete any room image. **Fix: match avatar policy — `auth.uid()::text = (storage.foldername(name))[1]`.**
- **SEC-9 (MEDIUM):** `006_room_members.sql:28-31` — owner cannot remove disruptive members. **Fix: add `OR room_id IN (SELECT id FROM rooms WHERE owner_id = auth.uid())`.**
- **SEC-10 (MEDIUM):** `004_friendships.sql:31-34` — UPDATE policy lets addressee change status to `blocked` (should only blocker). **Fix: constrain transitions via a trigger or tighter policy.**

### 1.4 Client-Side Trust
- **SEC-11 (HIGH):** `src/components/AppShell.jsx:38-39`, `src/stores/roomStore.js:268-275`, `src/components/ParticipantPanel.jsx:26,79-97` — `isOwner` / `isAdmin` / `canEdit` are all computed client-side. A modified client can set `isAdmin=true` and edit any room. **Fix: rely on RLS policies using `room_members.role`. Client checks are UX only.**
- **SEC-12 (HIGH):** `src/stores/voiceStore.js:50-74` — `identity` is sent from client to token endpoint. Server must override it with the authenticated user ID.

### 1.5 Realtime Channel Security
- **SEC-13 (MEDIUM):** `src/lib/roomChannel.js:27-45` — `broadcast` payloads for `furniture:add`, `furniture:move`, `furniture:remove`, `room:theme` are accepted from any subscriber. Server-side DB writes are RLS-guarded, but broadcasts aren't — a malicious client can flood fake furniture into other clients' local state. **Fix: ignore broadcast payloads; rely on the DB round-trip + postgres_changes for truth, or validate bounds/type in handlers.**

### 1.6 Storage
- **SEC-14 (HIGH):** `src/lib/roomService.js:177-186` — trusts client `file.type` for MIME. **Fix: validate extension whitelist, check magic bytes, set size limit in RLS (`metadata->>'size'::bigint < 5242880`).**

### 1.7 Auth Flows
- **SEC-15 (MEDIUM):** `src/stores/authStore.js:130-137` — `deleteAccount` only deletes `profiles` row. `auth.users` persists, along with rooms/furniture/friendships. **Fix: write a Supabase Edge Function using service role to cascade delete.**
- **SEC-16 (MEDIUM):** `SettingsPage.jsx:51-67` — password change has no current-password confirmation. Unattended browser → takeover. **Fix: re-authenticate with current password before `updateUser({password})`.**
- **SEC-17 (MEDIUM):** `authStore.js:125-128` — email change has no password confirmation. Same takeover vector.

### 1.8 Electron (positive finding)
- **SEC-18 (INFO):** `electron/main.cjs:17-21` + `preload.cjs` — `contextIsolation: true`, `nodeIntegration: false`, minimal exposed API. Good hardening. **No action needed.**

---

## SECTION 2 — BUGS & RACE CONDITIONS

### 2.1 Confirmed / High-Impact
- **BUG-1 (CRITICAL):** Duplicate `007_*.sql` — see B3.
- **BUG-2 (HIGH) — KNOWN:** Furniture cannot be added from palette. Trace: Palette → `setSelectedType` → Room `handleClick` → `placeFurnitureAt` → `addFurniture`. **`roomStore.js:310-318` has no try/catch, no null check on `_channel` or `roomId`, and `Room.jsx:200` clears `selectedType` on success regardless of DB failure.** Fix: wrap `addFurniture` in try/catch, propagate errors up to Room for user feedback, guard against missing channel.
- **BUG-3 (HIGH):** `roomStore.js:426-440` — `moveAvatar._t` debounce stores timer as a function property. Stale closure captures old `me` (displayName, color). Concurrent calls can desync. **Fix: move timer into store state, read `me` inside the timeout callback from `get()`.**
- **BUG-4 (HIGH):** `roomStore.js:477-499` — `sendKnock` / `sendInvite` await `channel.subscribe` without timeout or error branch. If status is `CHANNEL_ERROR` or `TIMED_OUT`, promise never resolves; UI hangs indefinitely. **Fix: reject after 5s, handle non-`SUBSCRIBED` statuses.**
- **BUG-5 (HIGH):** `Landing.jsx:231-253` — `lobby:${room.id}` presence channels are cleaned only when `myRooms` changes. If user signs out while on Landing, channels may leak. **Fix: add cleanup on unmount AND on auth change.**
- **BUG-6 (MEDIUM):** `roomStore.js:149-165` — `onPresenceSync` rebuilds the entire `participants` object every sync. New object reference triggers re-renders across all consumers even when only one user changed. **Fix: only touch changed participants; preserve stable references for unchanged entries.**
- **BUG-7 (MEDIUM):** `roomStore.js:202-215` — on theme change, only the local `me` is re-positioned if out-of-bounds. Other standing participants are left on void cells (visible to them as stuck / off-grid). **Fix: after a theme change propagates, each client should re-check its own position on `onRoomThemeChange`.**

### 2.2 State Sync / Optimistic Updates
- **BUG-8 (MEDIUM):** `roomStore.js:445-465` `setTheme` is optimistic — if `updateRoomTheme` throws, local state + broadcast already fired. Others see change, local persists until reload. **Fix: await DB first, or rollback on failure.**
- **BUG-9 (MEDIUM):** `roomStore.js` furniture move is optimistic without rollback (see also perf #4.3).
- **BUG-10 (MEDIUM):** `FurnitureItem.jsx:82-88` — find-empty-seat check uses local participants snapshot. Two users clicking the same seat simultaneously both proceed. Presence overwrite picks a winner non-deterministically. **Fix: treat seat assignment as last-writer-wins and handle the loser with a UI message, or add a Supabase function for atomic seat claim.**
- **BUG-11 (MEDIUM):** `roomStore.js:372-409` — `sitDown` / `standUp` call `_channel.track()` fire-and-forget. If track fails, local UI diverges from server truth. **Fix: handle track failure with a rollback and error toast.**

### 2.3 Error Handling Gaps
- **BUG-12 (MEDIUM):** `friendStore.js:20-32` — `Promise.all` in `loadFriends`: any single rejection aborts all three. With `silent=true` the loading indicator never clears. **Fix: use `Promise.allSettled` or independent try/catch.**
- **BUG-13 (MEDIUM):** `FriendsPanel.jsx:54` — `setInterval(loadFriends, 15000)` with no backoff; if Supabase is down, hammers forever. **Fix: exponential backoff + circuit breaker.**
- **BUG-14 (LOW):** `App.jsx:20-28` — `initialize()` has no `.catch()`. If `getSession` throws, loading state never clears. **Fix: wrap in try/catch, set `loading: false` in finally.**
- **BUG-15 (MEDIUM):** `useVoiceConnection.js:127-137` — if furniture a user is sitting on is deleted, `getParticipantPosition` returns null → `updateSpatialAudio` skips them → missing audio. **Fix: fall back to the last known position or force stand-up.**

### 2.4 UI Logic
- **BUG-16 (MEDIUM):** `ParticipantPanel.jsx:85` — `setActiveMenu(activeMenu === p.id ? null : p.id)` can leave multiple menus visually open if toggled rapidly. **Fix: always overwrite with the clicked id.**
- **BUG-17 (LOW):** `SeatMarker.jsx:35` — `avatarConfig` can be null → `getAvatarPalette(null)`. **Fix: default to `DEFAULT_AVATAR` constant.**
- **BUG-18 (LOW):** `audioSettingsStore.js:32-36` — setters don't clamp to `[0,1]`. Bad UI code can persist bad values to localStorage. **Fix: `Math.max(0, Math.min(1, v))`.**
- **BUG-19 (LOW):** `roomService.js:13-22` — `getRoomByJoinCode` uses `maybeSingle()`. No unique constraint exists on `join_code`. If a duplicate ever lands, first row wins non-deterministically. **Fix: add `UNIQUE(join_code)` in a new migration.**

### 2.5 Memory / Resource
- **BUG-20 (LOW):** `spriteRenderer.js:7-17` — cache is an unbounded Map keyed on `JSON.stringify`. Grows over long sessions. **Fix: LRU cap at ~500, or WeakMap keyed on stable sprite identity.**
- **BUG-21 (LOW):** `FurnitureItem.jsx:96-138` — drag window listeners not cleaned on unmount-mid-drag. Minor leak.
- **BUG-22 (LOW):** `useVoiceConnection.js:180` — `_micGainUnsub` only called in `_cleanup()`; effect re-runs without unmount leak the subscription.

---

## SECTION 3 — DEAD CODE / REDUNDANCY / CRUFT

### 3.1 Safe Deletes
- **DEAD-1 (HIGH):** `src/components/FriendPanel.jsx` — 0 imports; replaced by `ParticipantPanel.jsx` + `FriendsPanel.jsx`. Still references `roomStore.friends` which no longer exists.
- **DEAD-2 (HIGH):** `src/data/friends.js` — `MOCK_FRIENDS` array, 0 imports.
- **DEAD-3 (HIGH):** `server/auth.js`, `server/permissions.js`, `server/realtime.js`, `server/store.js`, `server/client.html` — all from pre-pivot Express backend. Only `server/server.js` still used (by `electron:dev` for local LiveKit token). **Action: delete the five, optionally delete whole `server/` and point Electron dev at the Netlify function.**
- **DEAD-4 (HIGH):** `test/` folder — 5 tests all importing from dead `/server/` modules; no test runner configured, no `npm test` script. **Delete whole folder.**
- **DEAD-5 (HIGH):** `server/package.json` — declares no dependencies; works only because root install covers it. Delete with server cleanup.
- **DEAD-6 (MEDIUM):** `scripts/generate-icon.js` — requires uninstalled `canvas` package, not referenced in `package.json` scripts. One-off asset generator.
- **DEAD-7 (HIGH):** `old_logo_sq.png`, `old_logo_sq2.jpg`, `old_logo_sq_nobg.png` — replaced by new logo set (~2.6 MB total).
- **DEAD-8 (HIGH):** Corrupted Windows-path artifacts in repo root: `"C\357\200\272ProjectsAudioChat.claudelaunch.json"` and `C:ProjectsAudioChat.claude/` directory.

### 3.2 Build Artifacts Committed to Git
- **DEAD-9 (HIGH):** `release/`, `release-v2/`, `release-v3/`, `out/`, `dist-electron/`, `dist/` — ~1.2 GB of build output committed. **Action: delete old ones, keep latest `release-v3/` only if needed for distribution; add the lot to `.gitignore`.** Current `.gitignore` is missing these.

### 3.3 Legacy Compat Shims
- **DEAD-10 (MEDIUM):** `roomStore.js:136-142` — pixel→grid furniture coord migration, written Mar 20. If no production rooms predate that, this shim can go.

### 3.4 Duplication
- **DEAD-11 (LOW):** `FriendsPanel.jsx` has two near-identical click-outside `useEffect` hooks (lines 71-93). Extract `useClickOutside`.
- **DEAD-12 (LOW):** Avatar editor is embedded in `SettingsPage.jsx` Avatar tab AND `AvatarEditor.jsx` exists standalone — verify both paths are reachable; otherwise unify.

### 3.5 Confirmed Active — Do NOT Delete
- `MusicPlayer.jsx` + `musicStore.js` — procedural lo-fi generation, renders conditionally when a `jukebox` furniture item is present. Not Spotify Listen Along.
- `EditRoomModal.jsx` — used from `AppShell.jsx:59-64` for owner room name + image edit.

---

## SECTION 4 — INCOMPLETE / PENDING FEATURES

### 4.1 Hard Blockers (Migrations & Buckets)
- **INC-1:** `supabase/migrations/004_friendships.sql` — NOT APPLIED. Friends system fully coded but hits a non-existent table.
- **INC-2:** `supabase/migrations/005_avatar_columns.sql` — NOT APPLIED. Avatar editor saves fail.
- **INC-3:** `supabase/migrations/006_room_members.sql` — NOT APPLIED. Room persistence + admin roles silently no-op. Code has graceful fallback.
- **INC-4:** Storage bucket `avatars` — needs manual creation in Supabase dashboard.
- **INC-5:** Storage bucket `room-images` — needs manual creation.

### 4.2 Partial UI
- **INC-6 (MEDIUM):** "Avatar as profile pic" — per CLAUDE.md. Pixel avatars render in rooms but friend list (`FriendsPanel.jsx:181`), participant panel (`ParticipantPanel.jsx:47`), and Landing header (`Landing.jsx:152`) still use color circle + initial.

### 4.3 Planned (Future Scope)
- Spotify "Listen Along" (procedural music exists in its place)
- Gaming Den LED light toggle
- Furniture animation frames
- Avatar animation (idle/walk)
- User-uploaded custom furniture sprites
- More furniture variety
- Rename project dir `AudioChat` → `Sidequest`

### 4.4 Distribution
- **INC-7 (MEDIUM):** GitHub release v0.2.0 is private (repo private) — no public download. Options: make repo public, host Windows installer as Netlify static asset, or use a cloud storage link.

### 4.5 TODO/FIXME Sweep
- **INC-8 (INFO):** No TODO/FIXME/HACK/XXX comments found in src/, server/, electron/, netlify/. Clean in that regard.

---

## SECTION 5 — CODE QUALITY & PERFORMANCE

### 5.1 React Perf (High Impact)
- **PERF-1 (HIGH):** `participants` object produces new reference on every presence sync → all consumers re-render. Biggest render-cost offender. **Fix: selector memoization with shallow compare; only touch changed keys in `onPresenceSync`.**
- **PERF-2 (HIGH):** `Room.jsx` (436 LOC) re-renders floor tiles + light map whenever participants change even though they don't depend on them. **Fix: split Room into `<RoomFloor memo>`, `<RoomWalls memo>`, `<RoomFurniture>`, `<RoomAvatars>`.**
- **PERF-3 (HIGH):** `useVoiceConnection.js:90-108` — spatial audio effect depends on `participants`, fires on every sync. **Fix: debounce ~50ms, or key on a derived position-hash.**
- **PERF-4 (MEDIUM):** `FurnitureItem.jsx` not wrapped in `React.memo` — all items re-render when any furniture moves.
- **PERF-5 (MEDIUM):** `audioSettingsStore.js` calls `saveSettings` on every slider tick. **Debounce to 200ms.**

### 5.2 Component Size
- **QUAL-1 (MEDIUM):** `FriendsPanel.jsx` (568 LOC), `Landing.jsx` (498), `Room.jsx` (436), `SettingsPage.jsx` (314). Split into sub-components.

### 5.3 No Error Boundary
- **QUAL-2 (HIGH):** No React error boundary anywhere — a single render error crashes the whole app. **Fix: wrap AppShell + each major panel.**

### 5.4 Accessibility
- **A11Y-1 (HIGH):** Icon-only buttons in `AppShell.jsx` (leave/voice/mute), `ParticipantPanel.jsx` (stand/menu), `FurnitureItem.jsx` (delete), `Room.jsx` (zoom) — no `aria-label`.
- **A11Y-2 (HIGH):** Drag-drop furniture has no keyboard alternative.
- **A11Y-3 (HIGH):** Modals (`SettingsPage`, `ConfirmDialog`, `EditRoomModal`) have no focus trap, no restore-focus on close, no `aria-modal`/`role="dialog"`.
- **A11Y-4 (HIGH):** `SeatMarker` seat dots purely visual; add `aria-label="Available seat"` / `"Occupied"`.
- **A11Y-5 (HIGH):** Voice status badges color-only; add text + icon.
- **A11Y-6 (MEDIUM):** Inputs in `SettingsPage` lack `<label>` / `aria-labelledby`.
- **A11Y-7 (MEDIUM):** Mic permission denied → only a console.warn. Surface as toast.
- **A11Y-8 (MEDIUM):** Glass UI contrast may fail WCAG AA; test with axe.

### 5.5 CSS
- **CSS-1 (MEDIUM):** `src/index.css` is 4550 lines. Split by component or adopt CSS modules.
- **CSS-2 (MEDIUM):** Z-index chaos: literals `9000`, `9999`, `10000`. Define `--z-*` variables.
- **CSS-3 (LOW):** `!important` declarations on room backgrounds — fix via specificity.
- **CSS-4 (LOW):** Magic numbers scattered; lift to CSS variables.
- **CSS-5 (LOW):** No mobile media queries (Electron desktop OK; web should support phones).

### 5.6 Error UX
- **UX-1 (HIGH):** LiveKit token failure → generic message. Differentiate network / 401 / 500.
- **UX-2 (HIGH):** Invalid join code → generic throw; no retry suggestion.
- **UX-3 (HIGH):** Supabase RLS denials → silent failures in `roomService.js`, `friendService.js`. Surface as toasts.
- **UX-4 (MEDIUM):** `EditRoomModal` network drop during save → no draft/rollback.
- **UX-5 (MEDIUM):** `moveFurniture` optimistic update with no rollback (also BUG-9).
- **UX-6 (MEDIUM):** Knock delivery is fire-and-forget, no ack to sender.
- **UX-7 (LOW):** `createRoom` has no `isCreatingRoom` state → double-submit possible.

### 5.7 useEffect Hygiene
- **HOOK-1 (MEDIUM):** `FurnitureItem.jsx:31-38` animation effect keyed on `spriteData?.frames?.length` (object reference might change).
- **HOOK-2 (MEDIUM):** `useVoiceConnection.js:38-50` — voice connect has no AbortController; leaving room mid-connect can set state on unmounted.
- **HOOK-3 (LOW):** `SettingsPage.jsx` — `setTimeout` for message auto-hide not cleaned up.

### 5.8 Config & Constants
- **CFG-1 (LOW):** Magic numbers across `voiceStore.js` (ROOM_WIDTH=500, MAX_DISTANCE=600), `Room.jsx` (zoom 0.4), `FurnitureItem.jsx` (SPRITE_SCALE=3), `StandingAvatar.jsx` (AVATAR_SCALE=3), `roomStore.js` (8000ms). Lift to `src/constants.js`.
- **CFG-2 (LOW):** Retry delays hard-coded in `voiceStore.js:138`; name them.

### 5.9 Naming
- **NAME-1 (LOW):** `FriendPanel.jsx` vs `FriendsPanel.jsx` vs `ParticipantPanel.jsx` — delete the first (DEAD-1) then the confusion clears.
- **NAME-2 (LOW):** `musicStore` export pattern inconsistent with `useXStore`.
- **NAME-3 (LOW):** `FurnitureItem.jsx` — fine to rename to `Furniture.jsx` or add JSDoc.

### 5.10 Bundle
- **BUNDLE-1 (LOW):** `Icon.jsx` (218 lines, all inline SVG) — bundles all icons regardless of use.
- **BUNDLE-2 (LOW):** `furnitureSprites.js` (917 lines of hand-coded grids) — consider lazy-load per theme.

### 5.11 Logging & Linting
- **LOG-1 (LOW):** All existing `console.error` / `console.warn` calls are legitimate error paths. No junk debug logs. A structured logger would be nice but not urgent.
- **LINT-1 (LOW):** No ESLint, Prettier, or pre-commit hooks configured. Add `eslint-plugin-react-hooks` to catch effect-dependency bugs.

---

## SECTION 6 — PRIORITY ORDER FOR FIX SESSION

Tackle in this order to maximize impact per session:

### P0 — Security & Deployment (blockers before prod):
1. Rotate all `.env` secrets, purge from git history (B1 / SEC-1).
2. Add Supabase auth validation to LiveKit token endpoint; derive identity server-side (SEC-3, SEC-12).
3. Rename `007_room_image.sql` → `008_room_image.sql` (B3).
4. Apply migrations 004, 005, 006, 007, 008 to Supabase. Create `avatars` and `room-images` buckets (B4, B5).
5. Tighten RLS: replace `USING (true)` on profiles/rooms/furniture (SEC-5, SEC-6, SEC-7). Fix room-image storage policy (SEC-8). Add owner-kick policy on room_members (SEC-9).

### P1 — Known Bug + Data Integrity:
6. Fix furniture palette add (BUG-2) — add try/catch + error surfacing + null guards in `roomStore.addFurniture`.
7. Fix `moveAvatar` debounce stale closure (BUG-3).
8. Fix `sendKnock` / `sendInvite` hang (BUG-4).
9. Stop mutating `participants` by reference on every sync (BUG-6 / PERF-1). Huge perf + correctness win.
10. Add timeout + rollback to optimistic `setTheme` / `moveFurniture` (BUG-8, BUG-9).

### P2 — Cleanup Pass:
11. Delete dead code: `FriendPanel.jsx`, `friends.js`, `server/*` except `server.js` (or delete whole `server/`), `test/`, `scripts/generate-icon.js`, old logos, path-corruption artifacts (DEAD-1 … DEAD-8).
12. Update `.gitignore` to exclude `release*/`, `out/`, `dist/`, `dist-electron/`. Commit removal of those 1.2 GB of artifacts (DEAD-9).
13. Fix duplicate click-outside effect in `FriendsPanel` — extract `useClickOutside` hook (DEAD-11).

### P3 — Error UX & Hardening:
14. Add top-level React error boundary (QUAL-2).
15. Surface RLS / token / network errors via toast system instead of silent fails (UX-1, UX-2, UX-3, A11Y-7).
16. Require current password to change password or email (SEC-16, SEC-17).
17. Complete account deletion via Edge Function with service role (SEC-15).

### P4 — Performance:
18. Memoize Room sub-components (PERF-2).
19. `React.memo` around `FurnitureItem` (PERF-4).
20. Debounce `audioSettingsStore` localStorage writes (PERF-5).
21. LRU cap on sprite cache (BUG-20).

### P5 — Accessibility:
22. Add `aria-label` to every icon-only button (A11Y-1).
23. Focus traps + `role="dialog"` on all modals (A11Y-3).
24. Keyboard placement for furniture (A11Y-2).

### P6 — Maintainability:
25. Split `index.css` by component; define z-index + spacing variables (CSS-1, CSS-2, CSS-4).
26. Split large components into sub-components (QUAL-1).
27. Extract constants file (CFG-1, CFG-2).
28. Add ESLint + Prettier + hooks plugin (LINT-1).

### P7 — Finish Feature:
29. Swap color-circle avatars for pixel-avatar profile pics in FriendsPanel, ParticipantPanel, Landing header (INC-6).
30. Decide on public distribution path for Windows installer (INC-7).

---

## APPENDIX — FINDINGS TOTAL

| Category | Count |
|---|---|
| Security | 18 |
| Bugs / races | 22 |
| Dead code / cruft | 12 (+ ~1.2 GB build artifacts) |
| Incomplete features | 8 |
| Quality / perf / a11y / CSS / UX | 50+ |
| **Total tracked findings** | **~110** |

No TODO/FIXME comments are in the code. No obvious unused npm dependencies. Electron hardening is solid. Code is generally well-organized and free of debug logging — the main risks are security posture (secrets, RLS, token endpoint auth) and one known functional bug (furniture palette add).

---

*Generated 2026-04-21 via 5 parallel read-only audits. No code modified. Hand this document to a Claude Code session along with `CLAUDE.md` and pick a priority tier to execute.*
