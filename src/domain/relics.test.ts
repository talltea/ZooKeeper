import { describe, it, expect } from 'vitest';
import {
  RELIC_TYPES,
  checkRelicEarns,
  getRelicType,
  relicsHandSizeDelta,
  relicsMultiplier,
} from './relics';
import { dayKey } from './engine';
import type { AppData, Card, CompletionLog, Relic } from './types';

const DAY = 24 * 60 * 60 * 1000;
// 2026-04-21 is a Tuesday (local).
const NOW = new Date(2026, 3, 21, 12, 0, 0).getTime();
const SUNDAY = new Date(2026, 3, 19, 12, 0, 0).getTime();

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deck_id: 'deck_upkeep',
    title: 'dishes',
    notes: '',
    target_interval_days: 7,
    energy: 'medium',
    duration_minutes: 15,
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

function blankData(overrides: Partial<AppData> = {}): AppData {
  return {
    decks: [],
    cards: [],
    completions: [],
    card_states: {},
    sessions: [],
    usage_days: [],
    archetype_id: null,
    relics: [],
    ...overrides,
  };
}

function relic(type_id: string): Relic {
  return { id: `r_${type_id}`, type_id, earned_at: NOW };
}

describe('RELIC_TYPES manifest', () => {
  it('ships the initial five relics', () => {
    expect(RELIC_TYPES.length).toBe(5);
  });

  it('has unique ids', () => {
    const ids = RELIC_TYPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every type has either a multiplier or a hand-size delta effect', () => {
    for (const t of RELIC_TYPES) {
      expect(Boolean(t.effect.multiplier) || Boolean(t.effect.hand_size_delta)).toBe(true);
    }
  });
});

describe('getRelicType', () => {
  it('returns null for an unknown id', () => {
    expect(getRelicType('nonesuch')).toBeNull();
  });

  it('returns the matching type', () => {
    expect(getRelicType('steadfast')?.name).toBe('Steadfast');
  });
});

describe('checkRelicEarns', () => {
  const usageForStreak = (days: number): string[] => {
    const out: string[] = [];
    for (let i = 0; i < days; i++) out.push(dayKey(NOW - i * DAY));
    return out;
  };

  it('grants Early Riser once a 3-day streak is reached', () => {
    const data = blankData({ usage_days: usageForStreak(3) });
    const earned = checkRelicEarns(data, NOW);
    expect(earned.map((r) => r.type_id)).toContain('early_riser');
  });

  it('does not re-grant a relic the user already owns', () => {
    const data = blankData({
      usage_days: usageForStreak(10),
      relics: [relic('early_riser'), relic('steadfast')],
    });
    expect(checkRelicEarns(data, NOW)).toEqual([]);
  });

  it('grants Centurion only at 100 completions', () => {
    const completions: CompletionLog[] = Array.from({ length: 99 }, (_, i) =>
      completion('c1', 0, `log-${i}`),
    );
    const under = checkRelicEarns(blankData({ completions }), NOW);
    expect(under.map((r) => r.type_id)).not.toContain('centurion');
    const at = checkRelicEarns(
      blankData({ completions: [...completions, completion('c1', 0, 'log-100')] }),
      NOW,
    );
    expect(at.map((r) => r.type_id)).toContain('centurion');
  });

  it('grants Deep Diver only after 5 Deep clean completions', () => {
    const deepCard = makeCard({ id: 'deep1', deck_id: 'deck_deep' });
    const otherCard = makeCard({ id: 'up1', deck_id: 'deck_upkeep' });
    const completions: CompletionLog[] = [
      ...Array.from({ length: 4 }, (_, i) => completion('deep1', i, `d-${i}`)),
      ...Array.from({ length: 10 }, (_, i) => completion('up1', i, `u-${i}`)),
    ];
    const under = checkRelicEarns(
      blankData({ cards: [deepCard, otherCard], completions }),
      NOW,
    );
    expect(under.map((r) => r.type_id)).not.toContain('deep_diver');

    const at = checkRelicEarns(
      blankData({
        cards: [deepCard, otherCard],
        completions: [...completions, completion('deep1', 5, 'd-5')],
      }),
      NOW,
    );
    expect(at.map((r) => r.type_id)).toContain('deep_diver');
  });

  it('grants Rare Hunter when a completion was ≥3× overdue vs prior completion', () => {
    const card = makeCard({ id: 'c1', target_interval_days: 7, created_at: NOW - 50 * DAY });
    // Prior completion 30 days ago, next completion today → 30/7 ≈ 4.28, past 3× threshold.
    const completions = [completion('c1', 30, 'old'), completion('c1', 0, 'new')];
    const earned = checkRelicEarns(blankData({ cards: [card], completions }), NOW);
    expect(earned.map((r) => r.type_id)).toContain('rare_hunter');
  });

  it('does not grant Rare Hunter for merely overdue (ratio ~1) completions', () => {
    // Card created 3 days before first completion → ratio 3/7 ≈ 0.43, then 7-day gap → ratio 1.
    const card = makeCard({ id: 'c1', target_interval_days: 7, created_at: NOW - 10 * DAY });
    const completions = [completion('c1', 7, 'a'), completion('c1', 0, 'b')];
    const earned = checkRelicEarns(blankData({ cards: [card], completions }), NOW);
    expect(earned.map((r) => r.type_id)).not.toContain('rare_hunter');
  });
});

describe('relicsMultiplier', () => {
  const ctx = { now: NOW, day_of_week: 2, overdue_ratio: 1 };

  it('returns 1 with no relics', () => {
    expect(relicsMultiplier(makeCard(), [], ctx)).toBe(1);
  });

  it('Centurion boosts Fun deck but leaves others alone', () => {
    const relics = [relic('centurion')];
    expect(relicsMultiplier(makeCard({ deck_id: 'deck_fun' }), relics, ctx)).toBeCloseTo(1.3, 10);
    expect(relicsMultiplier(makeCard({ deck_id: 'deck_upkeep' }), relics, ctx)).toBe(1);
  });

  it('Rare Hunter boosts once overdue_ratio crosses 2', () => {
    const relics = [relic('rare_hunter')];
    const card = makeCard();
    expect(relicsMultiplier(card, relics, { ...ctx, overdue_ratio: 1.5 })).toBe(1);
    expect(relicsMultiplier(card, relics, { ...ctx, overdue_ratio: 2 })).toBeCloseTo(1.2, 10);
    expect(relicsMultiplier(card, relics, { ...ctx, overdue_ratio: 5 })).toBeCloseTo(1.2, 10);
  });

  it('multiple relics compound', () => {
    const relics = [relic('centurion'), relic('deep_diver')];
    // Deep clean card with Centurion (no-op here, different deck) × Deep Diver (1.3).
    expect(relicsMultiplier(makeCard({ deck_id: 'deck_deep' }), relics, ctx)).toBeCloseTo(1.3, 10);
    // Fun card: Centurion 1.3, Deep Diver no-op.
    expect(relicsMultiplier(makeCard({ deck_id: 'deck_fun' }), relics, ctx)).toBeCloseTo(1.3, 10);
  });

  it('ignores unknown relic types rather than throwing', () => {
    const junk: Relic = { id: 'x', type_id: 'does_not_exist', earned_at: NOW };
    expect(relicsMultiplier(makeCard(), [junk], ctx)).toBe(1);
  });
});

describe('relicsHandSizeDelta', () => {
  it('Early Riser contributes +1 on Sunday, 0 otherwise', () => {
    const relics = [relic('early_riser')];
    expect(relicsHandSizeDelta(relics, { now: SUNDAY, day_of_week: 0, overdue_ratio: 0 })).toBe(1);
    expect(relicsHandSizeDelta(relics, { now: NOW, day_of_week: 2, overdue_ratio: 0 })).toBe(0);
  });

  it('Steadfast contributes +1 always', () => {
    const relics = [relic('steadfast')];
    expect(relicsHandSizeDelta(relics, { now: NOW, day_of_week: 2, overdue_ratio: 0 })).toBe(1);
  });

  it('stacks — Early Riser + Steadfast on Sunday = +2', () => {
    const relics = [relic('early_riser'), relic('steadfast')];
    expect(relicsHandSizeDelta(relics, { now: SUNDAY, day_of_week: 0, overdue_ratio: 0 })).toBe(2);
  });
});
