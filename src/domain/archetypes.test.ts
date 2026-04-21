import { describe, it, expect } from 'vitest';
import { ARCHETYPES, archetypeMultiplier, getArchetype } from './archetypes';
import type { Card } from './types';

const NOW = new Date(2026, 3, 21, 12, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deck_id: 'deck_upkeep',
    title: 'dishes',
    notes: '',
    target_interval_days: 7,
    energy: 'medium',
    duration_minutes: 30,
    time_of_day: 'any',
    context_tags: ['home'],
    parent_card_id: null,
    created_at: NOW - 30 * DAY,
    ...overrides,
  };
}

describe('getArchetype', () => {
  it('returns null for null id', () => {
    expect(getArchetype(null)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(getArchetype('nonesuch')).toBeNull();
  });

  it('returns the matching archetype by id', () => {
    const a = getArchetype('hermit');
    expect(a?.name).toBe('The Hermit');
  });
});

describe('archetypeMultiplier', () => {
  const generalist = getArchetype('generalist')!;
  const hermit = getArchetype('hermit')!;
  const recovering = getArchetype('recovering')!;
  const explorer = getArchetype('explorer')!;

  it('returns 1 for the Generalist (no weights)', () => {
    expect(archetypeMultiplier(makeCard(), generalist)).toBe(1);
  });

  it('applies deck_boost for a matching deck', () => {
    const card = makeCard({ deck_id: 'deck_upkeep', context_tags: [] });
    // Hermit upkeep boost is 1.4, no context match → 1.4
    expect(archetypeMultiplier(card, hermit)).toBeCloseTo(1.4, 10);
  });

  it('compounds multiple matching dimensions', () => {
    // Hermit: deck_upkeep 1.4 × home 1.3 = 1.82
    const card = makeCard({ deck_id: 'deck_upkeep', context_tags: ['home'] });
    expect(archetypeMultiplier(card, hermit)).toBeCloseTo(1.4 * 1.3, 10);
  });

  it('applies context_boost once per matching tag', () => {
    // Explorer: out 1.4 × errand 1.4 = 1.96 when card has both tags
    const card = makeCard({ deck_id: 'deck_admin', context_tags: ['out', 'errand'] });
    expect(archetypeMultiplier(card, explorer)).toBeCloseTo(1.4 * 1.4, 10);
  });

  it('short_duration_boost fires at the 15-minute boundary', () => {
    const short = makeCard({ duration_minutes: 15, context_tags: [] });
    const long = makeCard({ duration_minutes: 16, context_tags: [] });
    // Recovering: energy medium → 0.8; short_duration_boost 1.3
    expect(archetypeMultiplier(short, recovering)).toBeCloseTo(0.8 * 1.3, 10);
    expect(archetypeMultiplier(long, recovering)).toBeCloseTo(0.8, 10);
  });

  it('energy_boost suppresses when value < 1', () => {
    const card = makeCard({ energy: 'high', context_tags: [] });
    // Recovering: high 0.3, duration 30 so no short boost
    expect(archetypeMultiplier(card, recovering)).toBeCloseTo(0.3, 10);
  });
});

describe('ARCHETYPES manifest', () => {
  it('ships at least five archetypes plus the Generalist baseline', () => {
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(6);
    expect(ARCHETYPES.find((a) => a.id === 'generalist')).toBeTruthy();
  });

  it('includes the Recovering archetype (safe low-capacity default)', () => {
    // Required by DESIGN.md — archetype onboarding must have a forgiving option.
    expect(ARCHETYPES.find((a) => a.id === 'recovering')).toBeTruthy();
  });

  it('has unique ids', () => {
    const ids = ARCHETYPES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
