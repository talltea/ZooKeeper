import type { Card, ContextTag, Energy, TimeOfDay } from './types';

export interface ArchetypeWeights {
  deck_boost?: Record<string, number>;
  energy_boost?: Partial<Record<Energy, number>>;
  context_boost?: Partial<Record<ContextTag, number>>;
  time_boost?: Partial<Record<TimeOfDay, number>>;
  short_duration_boost?: number;
}

export interface Archetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  hand_size?: number;
  weights: ArchetypeWeights;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'generalist',
    name: 'The Generalist',
    icon: '🎲',
    description: 'No bias. Plain suggestion engine — every deck and card on even footing.',
    weights: {},
  },
  {
    id: 'hermit',
    name: 'The Hermit',
    icon: '🌿',
    description: 'Cozy and inward. Self-care and home upkeep surface first; quieter on going out.',
    weights: {
      deck_boost: { deck_upkeep: 1.4, deck_self: 1.4 },
      context_boost: { home: 1.3, out: 0.6, errand: 0.6 },
    },
  },
  {
    id: 'nester',
    name: 'The Nester',
    icon: '🏠',
    description: 'Make home feel good. Upkeep and deep clean cards surface first.',
    weights: {
      deck_boost: { deck_upkeep: 1.4, deck_deep: 1.5 },
      context_boost: { home: 1.3 },
    },
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    icon: '🧭',
    description: 'Out and about. Side quests and errand cards surface first.',
    weights: {
      deck_boost: { deck_fun: 1.6 },
      context_boost: { out: 1.4, errand: 1.4 },
    },
  },
  {
    id: 'minimalist',
    name: 'The Minimalist',
    icon: '📦',
    description: 'Narrower draws — hand of 2 instead of 3. Sharper focus, less noise.',
    hand_size: 2,
    weights: {},
  },
  {
    id: 'recovering',
    name: 'The Recovering',
    icon: '🫖',
    description: 'Low-capacity mode. Gentle, low-energy, short cards first. For tough seasons.',
    weights: {
      energy_boost: { low: 2.0, medium: 0.8, high: 0.3 },
      short_duration_boost: 1.3,
    },
  },
];

export function getArchetype(id: string | null): Archetype | null {
  if (!id) return null;
  return ARCHETYPES.find((a) => a.id === id) ?? null;
}

export function archetypeMultiplier(card: Card, archetype: Archetype): number {
  const w = archetype.weights;
  let m = 1;
  if (w.deck_boost?.[card.deck_id]) m *= w.deck_boost[card.deck_id];
  if (w.energy_boost?.[card.energy]) m *= w.energy_boost[card.energy]!;
  if (w.time_boost?.[card.time_of_day]) m *= w.time_boost[card.time_of_day]!;
  if (w.context_boost) {
    for (const tag of card.context_tags) {
      const boost = w.context_boost[tag];
      if (boost) m *= boost;
    }
  }
  if (w.short_duration_boost && card.duration_minutes <= 15) m *= w.short_duration_boost;
  return m;
}
