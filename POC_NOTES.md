# POC shortcuts

Running notes on what was skipped / simplified in the first proof-of-concept pass. Each item is a place to come back to, not a defect.

## Stack deviations from DESIGN.md

- **`localStorage` instead of Dexie/IndexedDB.** Single JSON blob under key `zoo_keeper_data_v1`. Fine for ~hundreds of cards; will choke on large completion histories. Swap for Dexie when we actually care about durability and incremental writes.
- **No PWA.** No `vite-plugin-pwa`, no manifest, no service worker, no `navigator.storage.persist()`. Runs as a plain web app. Install to home screen is not supported. Add these before the app is actually useful on a phone.
- **No tests.** The domain engine is framework-free and the clean split is there to make tests easy to add, but no test runner is wired up yet. `engine.ts` is the obvious first target.

## Features skipped from the core loop

- **Mini-quests.** Schema supports `parent_card_id` (parent cards are treated as drawable, children are filtered out of draws), but there's no UI to create or check off step lists, and no mini-quest satisfaction flourish.
- **Retire.** Supported in the domain engine (`CardState.retired_at`) but no UI surface — users can only delete. Restore workflow also absent.
- **Snooze presets.** Only 1d and 7d buttons on drawn cards. No custom duration picker, no "snoozed cards" view.
- **Context-tag filter, time-of-day filter.** Domain engine applies them correctly if `DrawFilters` passes them through, but the UI only exposes deck + energy-cap. No auto time-of-day derivation from clock.
- **Undo toast** after complete/snooze/retire. Completions are irreversible in the UI.
- **Per-card history view.** DecksView shows "last: 3d ago" and an overdue ratio; no timeline of completions.
- **App history view / weekly summary.** Draw sessions are recorded but nothing reads them.
- **Export / import.** Schema has `version` hook implicit in the storage key, but no export/import UI, no JSON round-trip.
- **"Mark done" already present** in DecksView — included since it was cheap and the design calls for it.

## Streak simplification

- Streak = consecutive days the user opened the app and drew at least once. Design called for "energy points (max 3/day) that decay at 1/day" — that's a richer model, deferred.
- `computeStreak` walks backward from today (or yesterday if today is empty, so streaks don't break mid-evening before the user uses the app).

## Draw weighting

- Implemented per design: `overdue_ratio = (now - last_completed) / target_interval`, `weight = sqrt(max(0, ratio - 0.5))`.
- `FRESH_THRESHOLD = 0.5` is a guess; no tuning pass yet.
- Rarity labels (`fresh` / `ready` / `rare` / `epic`) hardcoded at 0.5 / 1 / 2 / 3. Placeholder.
- Never-completed cards: `lastCompletedAt` falls back to `created_at` as the design specifies.

## UX / visual shortcuts

- Inline styles in components, no shared design system.
- No animation on completion — just a green flash bar with text.
- No dark/light toggle (dark only).
- Confirm dialog for delete uses `window.confirm`.
- Deck icons/colors hardcoded in `seed.ts`.

## Data model gaps

- No deck CRUD. Decks are seeded on first run and cannot be renamed, recolored, added, or removed from the UI.
- Reset button not exposed; to wipe data, clear `localStorage['zoo_keeper_data_v1']` in devtools.

## Things I did keep honest

- Domain engine is framework-free (`src/domain/*`), no Svelte or storage imports — directly unit-testable when we add a runner.
- Filter → weight → sample pipeline matches the design's ordering so tuning knobs land where the doc expects.
- `DrawSession` is persisted even though nothing reads it yet — keeps the data model honest for future history / export.
- Energy filter is a **cap** (low → only low; medium → low+medium; high → all) per open question #2.
