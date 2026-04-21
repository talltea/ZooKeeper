# Design Doc — (working title: Zoo Keeper)

A suggestion-engine app for gamifying real-world life upkeep. The user configures recurring tasks they *want* to do; when they open the app and ask "what should I do?", the app surfaces a small hand of tasks biased toward what's been neglected — framed as a card draw from one or more decks.

## Design principles

- **Suggestion, not coercion.** The app cannot actually make anyone do anything. Features that pretend otherwise (locked rewards, punishments for skipping) feel fake and erode trust. Everything is a nudge.
- **Skipping is free.** Refusing a suggestion is a first-class action, not a failure state.
- **Context-aware.** The user's energy, available time, and circumstances should shape what gets suggested. No coffee-shop side quests during the night-time house reset.
- **Reward showing up, not performing.** Streaks and satisfaction moments attach to *using the app* and completing *anything*, not to hitting specific tasks.

## Core loop

1. User opens the app and taps Draw.
2. User picks filters: which deck(s), mood/energy, time/context.
3. App filters the card pool, weights by neglect, and samples N cards (default 3).
4. User picks one, passes, snoozes, or retires any of them.
5. On completion, the card's completion log is updated; user sees a small satisfaction moment.
6. Using the app at all today extends the usage streak.

## Decks

Equal-status decks the user can draw from together or individually. Starter set:

- **Upkeep** — recurring chores (dishes, laundry, watering plants)
- **Admin** — life logistics (bills, appointments, filing)
- **Deep clean** — rarer, heavier tasks (oven, closet purge)
- **Self-care** — stretching, meal prep, sleep reset
- **Side quests (Fun)** — things the user wants to do but keeps deferring (try a new coffee shop, call a friend, start a book)

The Fun deck sits alongside the others with the same mechanics — no gating, no token economy. It's just a deck.

The app ships with the starter decks above pre-populated with a handful of example cards each. Users can edit, remove, or ignore them.

## Cards

Each card represents a task the user wants to do with some frequency.

Fields:
- `title`, `notes`
- `deck_id`
- `target_interval_days` — how often the user wants to do this (e.g. 7)
- `energy` — low / medium / high
- `duration_minutes` — rough estimate
- `time_of_day` — morning / day / evening / any
- `context_tags` — home / out / errand / anywhere
- `parent_card_id` — for mini-quest steps (see below)

### Mini-quests

Some cards are parents of a cluster of steps: "Kitchen reset" = wipe counters + dishes + sweep. Completing any step counts as progress; finishing all steps within a window triggers a bonus satisfaction moment. Good for chaining naturally-clustered tasks without forcing them.

Mini-quest steps are **not drawable individually**. The parent card is what appears in a draw; the card detail view expands the step list so the user can check off steps as they go.

## Draw mechanics

### Filters (applied before weighting)

Drop cards that don't match the current draw context:
- Deck selection (one, several, or all)
- Mood/energy cap (e.g. "low energy" → only low-energy cards)
- Time of day (derived from clock; user can override)
- Context (home/out/errand — explicit selection, not GPS, for privacy and simplicity)
- Snoozed or retired cards

### Weighting

For each remaining card:

```
overdue_ratio = (now - last_completed) / target_interval
weight = max(0, overdue_ratio - threshold)
```

Tuning knobs (TBD):
- `threshold` — below this, a card is "fresh" and basically never drawn. Keeps the pool focused on things actually worth suggesting.
- Soft curve (sqrt or log) so mildly-overdue cards still have a shot against nuclear-option "you haven't done this in 3× the target" cards.
- Rarity presentation: very overdue cards visually marked as rare/epic.

Never-completed cards are treated as if `last_completed = created_at`, so they phase in naturally as the target interval elapses rather than slamming the top of the draw pool the moment they're created.

### Sampling

Weighted random without replacement; default hand size N = 3.

## Skip / snooze / retire

- **Pass.** Card goes back, weight unchanged. No punishment.
- **Snooze.** User picks N days; card is filtered out and its weight does not climb during the snooze window.
- **Retire.** Card leaves rotation until explicitly revived. For "not for me right now" without deleting setup.

## Streaks and satisfaction

- Streak tracks **days the user opened the app and drew at least once**, not completion of any specific task.
- Completion shows a small flourish (animation / sound — TBD).
- Mini-quest completion (all steps within a window) gets a bigger flourish.

### History views

- **App history.** A "recent activity" view: draws made, cards completed, streak status, lightweight weekly summary ("this week you completed 8 cards").
- **Per-card history.** Each card's detail view shows its own completion log — timestamps of when it was last done, how close it's been to its target interval over time, and any recent snoozes. Useful for tuning `target_interval_days` based on reality.

## Export / import (user-driven sync)

No cloud, no accounts. The user manages their own sync by exporting a snapshot from one device and importing it on another.

- **Export.** Dump all decks, cards, completion logs, and card state to a single JSON file. Download via the browser's save dialog.
- **Import.** User picks a JSON file. Import **replaces** the entire local dataset, after a confirmation dialog that clearly states this.
- **Format.** Versioned JSON (`{ "version": 1, "exportedAt": ..., "decks": [...], "cards": [...], ... }`) so we can migrate old exports.
- **No merge in v1.** Merging across devices requires conflict resolution on completion logs (last-write-wins by timestamp is plausible but has edge cases). Replace-only is simple and honest; users who want real multi-device use will feel the pain and we can add merge in v2.
- **`DrawSession` logs are included** in the export. They're small, they're part of the user's history, and excluding them would make imports on a new device lose streak context.

## Platform & stack

Target: **static PWA**, primary device Google Pixel (Android Chrome).

- Local-first, no backend. All data on-device in IndexedDB.
- Installable to home screen; fullscreen, app-like feel.
- Hosted as static files (GitHub Pages / Netlify / Cloudflare Pages).
- iOS works but is second-class (weaker install UX, historically weaker PWA support). Not a v1 priority.

**Stack**
- **Svelte + Vite** for the app (small, fast, good ergonomics for this scale). Open to plain Vite + TS if we want even less.
- **Dexie** as the IndexedDB wrapper.
- **`vite-plugin-pwa`** for manifest + service worker.
- **TypeScript** throughout.

**Storage durability**
- Call the Persistent Storage API on install (`navigator.storage.persist()`) so Chrome won't evict data under pressure.
- Nudge the user to install to home screen — installed PWAs get persistent storage by default on Android.

## Data model

```
Deck(id, name, icon, color)

Card(
  id,
  deck_id,
  title,
  notes,
  target_interval_days,
  energy,                -- enum: low | medium | high
  duration_minutes,
  time_of_day,           -- enum: morning | day | evening | any
  context_tags,          -- set: home | out | errand | anywhere
  parent_card_id,        -- nullable, for mini-quest steps
  created_at
)

CompletionLog(id, card_id, completed_at)

CardState(card_id, snoozed_until, retired_at)

DrawSession(
  id,
  started_at,
  filters_json,
  cards_offered_json,    -- ids
  card_chosen_id         -- nullable (user may pass on all)
)
```

## Architecture layers

Pure-core / thin-shell split — engine is framework-free and unit-testable.

1. **Domain** — models + engine (filter, weight, sample). No I/O, no UI.
2. **Persistence** — Dexie wrapper, schema migrations, export/import serialization.
3. **App services** — draw session orchestration, completion handling, streak tracker.
4. **UI (Svelte)** — deck/card management, draw flow, completion screens, history, settings (including export/import).

## Out of scope for v1

- Notifications / reminders (contradicts the "not a nag" principle; revisit later as opt-in).
- Social / sharing.
- Cloud sync / accounts.
- Merge-based import (replace-only in v1).
- Gamified XP / levels / cosmetics (deliberately thin satisfaction layer for v1).

## Open questions

(Previous round resolved inline above.)

Next round — smaller but real:

1. **Snooze durations.** Fixed presets (1 day / 3 days / 1 week / custom).
2. **Mood/energy filter semantics.** Selecting "low energy" show **only** low. Treating it as a cap (low shows low; medium shows low+medium; high shows all) is the intuitive read.
3. **Time-of-day boundaries.** Fixed defaults (e.g. morning = 05–11, day = 11–17, evening = 17–23, night collapsed into evening). User-configurable later.
4. **Streak breakage.** Lenient - get energy points for completing cards (max of 3 per day) and those slowly decay, one energy point per day.
5. **"Mark done" outside a draw.** If the user actually did the dishes without drawing, should they be able to tap a card in the deck and mark it done? Yes.
6. **Delete vs. retire.** `Retire` keeps history; `Delete` removes the card entirely. Both.
7. **Undo window.** After completing, snoozing, or retiring a card, should there be a short "undo" toast? Yes.
8. **Mini-quest completion window.** Rolling 24h.
