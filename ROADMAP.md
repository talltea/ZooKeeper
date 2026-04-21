# Roadmap — Zoo Keeper

From current POC to what's described in [DESIGN.md](./DESIGN.md). Biggest-impact items first. See [POC_NOTES.md](./POC_NOTES.md) for the current-state caveats this roadmap is paying down.

Current POC: draw loop works, seeded decks only, `localStorage` single-blob persistence, no install, no tests, ~10 major gaps from DESIGN.md.

## 1. Foundation — make it shippable

Without this, nothing else matters: data can vanish, nobody installs it, and regressions pile up as features land.

- **PWA shell.** `vite-plugin-pwa`, manifest, service worker, `navigator.storage.persist()`, install-to-home-screen nudge.
- **Dexie migration.** Move the single-blob `localStorage['zoo_keeper_data_v1']` to IndexedDB with a schema version.
- **Export / import.** JSON round-trip with confirm-replace dialog per DESIGN.md.

## 2. Custom life modeling — the core promise

The single largest feature gap. Nobody's life fits generic starter decks.

- **Deck CRUD** (create, rename, recolor, icon-pick, delete).
- **Full card edit UI** — all schema fields editable, not just seed data.
- **User decks in practice** — ability to add Pets / Garden / Kids / Work / Hobby decks.

## 3. Forgiving, trustworthy UX

Honors the "skipping is free" principle and makes the app safe to use on bad days.

- **Undo toast** on complete / snooze / retire / delete.
- **Snooze presets + custom duration picker** (not just 1d / 7d).
- **Retire UI + restore workflow** (domain engine supports it; UI missing).
- **Deck pause + app pause ("vacation mode")** — freeze overdue ratios and streak.

## 4. Richer filtering + Modes

Exposes the filter pipeline that already exists in the engine; delivers the Fun-mode lever.

- **Context-tag filter UI.**
- **Time-of-day filter** — auto-derive from clock, user-overridable.
- **Modes** — saved filter presets. Ship Fun, Quick reset, Low-spoons as defaults; user-defined after.

## 5. Content + history

Scales the app to more users (templates) and gives ambient progress signal (history).

- **Deck templates** — Dog owner, Houseplants, New parent, Renter, WFH, Student, Caregiver.
- **Mini-quest UI** — step lists on parent cards, check-off, rolling-24h bonus flourish.
- **Per-card history view** — completion timeline, overdue-ratio-over-time.
- **App history / weekly summary** — reads the `DrawSession` records that already persist.

## 6. Game mode (default)

The roguelike layer. Default experience per design decision 2026-04-21, not hidden behind a toggle. Lighter pieces first so archetypes can ship before relics land.

- ~~**Archetypes** — onboarding picker, weight deltas in engine, switchable. Ship 5–6 archetypes initially.~~ Shipped: Generalist / Hermit / Nester / Explorer / Minimalist / Recovering. Weights bias by seeded deck id, energy, context, time-of-day, and short-duration; Minimalist overrides hand size. See [POC_NOTES.md](./POC_NOTES.md#archetype-limitations).
- **Energy-point streak** — replace the simple opened-and-drew streak with the 3-points-max / 1-point-decay model from DESIGN.md open question 4.
- ~~**Relics** — data model, earn conditions, weighting hooks.~~ Shipped: Early Riser, Steadfast, The Centurion, Deep Diver, Rare Hunter. Permanent-once-earned; multipliers and hand-size deltas stack with archetype weights. See [POC_NOTES.md](./POC_NOTES.md#relics) for limits and tuning caveats.
- **Rarity rewards** — bonus on epic/rare card completion.
- **Commit-draws** — opt-in per draw.
- **Weekly boss floor** — curated Deep-clean cluster with reward.

## 7. Polish

- Satisfaction animations replacing the green flash bar.
- Shared design system / extract inline styles.
- Dark/light toggle.
- Custom confirm dialogs (replace `window.confirm`).
- Reset button in settings.

## Dependencies to flag

- Game mode (6) assumes Dexie (1) — energy points and relics grow tables that `localStorage` won't handle well.
- Modes (4) and Pause (3) both want Dexie for clean indexed queries, though they'd work on top of `localStorage`.
