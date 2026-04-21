import { describe, it, expect } from 'vitest';
import {
  FRESH_THRESHOLD,
  cardWeight,
  computeStreak,
  dayKey,
  draw,
  filterCards,
  lastCompletedAt,
  overdueRatio,
  weightedSampleWithoutReplacement,
} from './engine';
import type { AppData, Card, CardState, CompletionLog, DrawFilters } from './types';

function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 3, 21, 12, 0, 0).getTime();

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deck_id: 'd1',
    title: 'dishes',
    notes: '',
    target_interval_days: 7,
    energy: 'low',
    duration_minutes: 10,
    time_of_day: 'any',
    context_tags: ['home'],
    parent_card_id: null,
    created_at: NOW - 30 * DAY,
    ...overrides,
  };
}

function completion(card_id: string, daysAgo: number, id = `l-${card_id}-${daysAgo}`): CompletionLog {
  return { id, card_id, completed_at: NOW - daysAgo * DAY };
}

describe('lastCompletedAt', () => {
  it('falls back to created_at when the card has never been completed', () => {
    const card = makeCard({ created_at: NOW - 10 * DAY });
    expect(lastCompletedAt(card, [])).toBe(card.created_at);
  });

  it('returns the most recent completion timestamp', () => {
    const card = makeCard();
    const logs = [completion('c1', 5), completion('c1', 1), completion('c1', 3)];
    expect(lastCompletedAt(card, logs)).toBe(NOW - 1 * DAY);
  });

  it('ignores completions that belong to other cards', () => {
    const card = makeCard({ id: 'c1', created_at: NOW - 20 * DAY });
    const logs = [completion('c2', 1)];
    expect(lastCompletedAt(card, logs)).toBe(card.created_at);
  });
});

describe('overdueRatio', () => {
  it('is roughly 1 when exactly one interval has passed since the last completion', () => {
    const card = makeCard({ target_interval_days: 7 });
    const logs = [completion('c1', 7)];
    expect(overdueRatio(card, logs, NOW)).toBeCloseTo(1, 10);
  });

  it('is 0 for a zero-interval card (guards against divide-by-zero)', () => {
    const card = makeCard({ target_interval_days: 0 });
    expect(overdueRatio(card, [], NOW)).toBe(0);
  });

  it('exceeds 1 when a card is past its target', () => {
    const card = makeCard({ target_interval_days: 7 });
    const logs = [completion('c1', 21)];
    expect(overdueRatio(card, logs, NOW)).toBeCloseTo(3, 10);
  });
});

describe('filterCards', () => {
  const baseFilters: DrawFilters = { deck_ids: null };

  it('drops mini-quest step cards (children of a parent card)', () => {
    const parent = makeCard({ id: 'p' });
    const step = makeCard({ id: 's', parent_card_id: 'p' });
    expect(filterCards([parent, step], {}, baseFilters, NOW).map((c) => c.id)).toEqual(['p']);
  });

  it('drops retired cards', () => {
    const card = makeCard();
    const states: Record<string, CardState> = {
      c1: { card_id: 'c1', snoozed_until: null, retired_at: NOW - DAY },
    };
    expect(filterCards([card], states, baseFilters, NOW)).toEqual([]);
  });

  it('drops cards with an active snooze and re-includes them once the snooze has expired', () => {
    const card = makeCard();
    const active: Record<string, CardState> = {
      c1: { card_id: 'c1', snoozed_until: NOW + DAY, retired_at: null },
    };
    const expired: Record<string, CardState> = {
      c1: { card_id: 'c1', snoozed_until: NOW - DAY, retired_at: null },
    };
    expect(filterCards([card], active, baseFilters, NOW)).toEqual([]);
    expect(filterCards([card], expired, baseFilters, NOW)).toEqual([card]);
  });

  it('restricts to selected decks when deck_ids is non-empty', () => {
    const a = makeCard({ id: 'a', deck_id: 'd1' });
    const b = makeCard({ id: 'b', deck_id: 'd2' });
    const result = filterCards([a, b], {}, { deck_ids: ['d2'] }, NOW);
    expect(result.map((c) => c.id)).toEqual(['b']);
  });

  it('treats energy_cap as a cap: low shows low; medium shows low+medium; high shows all', () => {
    const lo = makeCard({ id: 'lo', energy: 'low' });
    const md = makeCard({ id: 'md', energy: 'medium' });
    const hi = makeCard({ id: 'hi', energy: 'high' });
    const pool = [lo, md, hi];
    expect(filterCards(pool, {}, { ...baseFilters, energy_cap: 'low' }, NOW).map((c) => c.id)).toEqual(['lo']);
    expect(filterCards(pool, {}, { ...baseFilters, energy_cap: 'medium' }, NOW).map((c) => c.id)).toEqual(['lo', 'md']);
    expect(filterCards(pool, {}, { ...baseFilters, energy_cap: 'high' }, NOW).map((c) => c.id)).toEqual(['lo', 'md', 'hi']);
  });

  it('time_of_day: specific filter keeps matching cards plus cards tagged "any"', () => {
    const morn = makeCard({ id: 'm', time_of_day: 'morning' });
    const eve = makeCard({ id: 'e', time_of_day: 'evening' });
    const any = makeCard({ id: 'a', time_of_day: 'any' });
    const out = filterCards([morn, eve, any], {}, { ...baseFilters, time_of_day: 'morning' }, NOW);
    expect(out.map((c) => c.id)).toEqual(['m', 'a']);
  });

  it('context: "anywhere" filter is a no-op; specific context keeps matches plus "anywhere"-tagged cards', () => {
    const home = makeCard({ id: 'h', context_tags: ['home'] });
    const out = makeCard({ id: 'o', context_tags: ['out'] });
    const any = makeCard({ id: 'a', context_tags: ['anywhere'] });
    const pool = [home, out, any];
    expect(filterCards(pool, {}, { ...baseFilters, context: 'anywhere' }, NOW).map((c) => c.id)).toEqual(['h', 'o', 'a']);
    expect(filterCards(pool, {}, { ...baseFilters, context: 'home' }, NOW).map((c) => c.id)).toEqual(['h', 'a']);
  });
});

describe('cardWeight', () => {
  it('is 0 for a fresh card (ratio below FRESH_THRESHOLD)', () => {
    const card = makeCard({ target_interval_days: 10 });
    const logs = [completion('c1', 1)];
    expect(cardWeight(card, logs, NOW)).toBe(0);
  });

  it('returns sqrt(ratio - threshold) once overdue', () => {
    const card = makeCard({ target_interval_days: 7 });
    const logs = [completion('c1', 21)];
    const expected = Math.sqrt(3 - FRESH_THRESHOLD);
    expect(cardWeight(card, logs, NOW)).toBeCloseTo(expected, 10);
  });

  it('is never negative', () => {
    const card = makeCard({ target_interval_days: 100, created_at: NOW });
    expect(cardWeight(card, [], NOW)).toBeGreaterThanOrEqual(0);
  });
});

describe('weightedSampleWithoutReplacement', () => {
  it('picks N distinct items without replacement', () => {
    const items = ['A', 'B', 'C'];
    const out = weightedSampleWithoutReplacement(items, [1, 1, 1], 3, seq(0));
    expect(out.sort()).toEqual(['A', 'B', 'C']);
  });

  it('returns whatever is available when N exceeds the pool size', () => {
    const out = weightedSampleWithoutReplacement(['A', 'B'], [1, 1], 5, seq(0));
    expect(out).toHaveLength(2);
  });

  it('returns an empty array when every weight is zero', () => {
    const out = weightedSampleWithoutReplacement(['A', 'B'], [0, 0], 2, seq(0.5));
    expect(out).toEqual([]);
  });

  it('biases selection toward higher-weight items (deterministic RNG)', () => {
    // weights [1, 9]; rng=0.5 → r=5, step past A (weight 1, r→4), pick B.
    const out = weightedSampleWithoutReplacement(['A', 'B'], [1, 9], 1, seq(0.5));
    expect(out).toEqual(['B']);
  });
});

describe('draw', () => {
  const deck = { id: 'd1', name: '', icon: '', color: '' };

  it('excludes fresh (zero-weight) cards from the drawable pool and reports pool_size accordingly', () => {
    const overdue = makeCard({ id: 'overdue', target_interval_days: 7 });
    const fresh = makeCard({ id: 'fresh', target_interval_days: 100 });
    const data: AppData = {
      decks: [deck],
      cards: [overdue, fresh],
      completions: [completion('overdue', 21), completion('fresh', 1)],
      card_states: {},
      sessions: [],
      usage_days: [],
      archetype_id: null,
      relics: [],
    };
    const result = draw(data, { deck_ids: null }, 3, NOW, seq(0));
    expect(result.pool_size).toBe(1);
    expect(result.cards.map((c) => c.id)).toEqual(['overdue']);
  });

  it('respects filters before weighting', () => {
    const home = makeCard({ id: 'h', context_tags: ['home'] });
    const out = makeCard({ id: 'o', context_tags: ['out'] });
    const data: AppData = {
      decks: [deck],
      cards: [home, out],
      completions: [completion('h', 21), completion('o', 21)],
      card_states: {},
      sessions: [],
      usage_days: [],
      archetype_id: null,
      relics: [],
    };
    const result = draw(data, { deck_ids: null, context: 'home' }, 3, NOW, seq(0));
    expect(result.cards.map((c) => c.id)).toEqual(['h']);
  });

  it('applies weightMultiplier on top of cardWeight when provided', () => {
    // Both cards equally overdue; multiplier zeroes out one of them so the other is always picked.
    const a = makeCard({ id: 'a' });
    const b = makeCard({ id: 'b' });
    const data: AppData = {
      decks: [deck],
      cards: [a, b],
      completions: [completion('a', 21), completion('b', 21)],
      card_states: {},
      sessions: [],
      usage_days: [],
      archetype_id: null,
      relics: [],
    };
    const multiplier = (c: Card) => (c.id === 'a' ? 1 : 0);
    const result = draw(data, { deck_ids: null }, 1, NOW, seq(0.5), multiplier);
    expect(result.cards.map((c) => c.id)).toEqual(['a']);
  });
});

describe('dayKey', () => {
  it('formats as local-time YYYY-MM-DD with zero-padded month and day', () => {
    const ts = new Date(2026, 0, 5, 12).getTime();
    expect(dayKey(ts)).toBe('2026-01-05');
  });
});

describe('computeStreak', () => {
  const keyFor = (daysAgo: number) => dayKey(NOW - daysAgo * DAY);

  it('returns 0 with no usage history', () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(computeStreak([keyFor(0), keyFor(1), keyFor(2)], NOW)).toBe(3);
  });

  it('grants a grace day: today missing but yesterday present still counts', () => {
    // Without this, streaks would break mid-evening before the user opens the app.
    expect(computeStreak([keyFor(1), keyFor(2)], NOW)).toBe(2);
  });

  it('returns 0 when both today and yesterday are missing', () => {
    expect(computeStreak([keyFor(2), keyFor(3)], NOW)).toBe(0);
  });

  it('stops at the first gap', () => {
    expect(computeStreak([keyFor(0), keyFor(1), keyFor(3)], NOW)).toBe(2);
  });
});
