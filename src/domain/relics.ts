import type { AppData, Card, CompletionLog, Relic } from './types';
import { computeStreak } from './engine';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RelicContext {
  now: number;
  day_of_week: number;
  overdue_ratio: number;
}

export interface RelicEffect {
  multiplier?(card: Card, ctx: RelicContext): number;
  hand_size_delta?(ctx: RelicContext): number;
}

export interface RelicProgress {
  current: number;
  target: number;
}

export interface RelicType {
  id: string;
  name: string;
  icon: string;
  description: string;
  hint: string;
  progress(data: AppData, now: number): RelicProgress;
  effect: RelicEffect;
}

function completionsInDeck(data: AppData, deckId: string): number {
  const cardIds = new Set(data.cards.filter((c) => c.deck_id === deckId).map((c) => c.id));
  let n = 0;
  for (const c of data.completions) if (cardIds.has(c.card_id)) n++;
  return n;
}

function hasEpicCompletion(data: AppData): boolean {
  const cardMap = new Map(data.cards.map((c) => [c.id, c]));
  const byCard = new Map<string, CompletionLog[]>();
  for (const c of data.completions) {
    const arr = byCard.get(c.card_id) ?? [];
    arr.push(c);
    byCard.set(c.card_id, arr);
  }
  for (const [cardId, logs] of byCard) {
    const card = cardMap.get(cardId);
    if (!card) continue;
    const intervalMs = card.target_interval_days * DAY_MS;
    if (intervalMs <= 0) continue;
    const sorted = [...logs].sort((a, b) => a.completed_at - b.completed_at);
    let prev = card.created_at;
    for (const log of sorted) {
      const ratio = (log.completed_at - prev) / intervalMs;
      if (ratio >= 3) return true;
      prev = log.completed_at;
    }
  }
  return false;
}

export const RELIC_TYPES: RelicType[] = [
  {
    id: 'early_riser',
    name: 'Early Riser',
    icon: '🌅',
    description: '+1 hand size on Sundays.',
    hint: 'Keep a 3-day streak.',
    progress: (data, now) => ({
      current: Math.min(computeStreak(data.usage_days, now), 3),
      target: 3,
    }),
    effect: {
      hand_size_delta: (ctx) => (ctx.day_of_week === 0 ? 1 : 0),
    },
  },
  {
    id: 'steadfast',
    name: 'Steadfast',
    icon: '🏛️',
    description: '+1 hand size, always.',
    hint: 'Keep a 10-day streak.',
    progress: (data, now) => ({
      current: Math.min(computeStreak(data.usage_days, now), 10),
      target: 10,
    }),
    effect: {
      hand_size_delta: () => 1,
    },
  },
  {
    id: 'centurion',
    name: 'The Centurion',
    icon: '💯',
    description: 'Side quests (Fun) cards surface 30% more.',
    hint: 'Complete 100 cards.',
    progress: (data) => ({
      current: Math.min(data.completions.length, 100),
      target: 100,
    }),
    effect: {
      multiplier: (card) => (card.deck_id === 'deck_fun' ? 1.3 : 1),
    },
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    icon: '🧼',
    description: 'Deep clean cards surface 30% more.',
    hint: 'Complete 5 Deep clean cards.',
    progress: (data) => ({
      current: Math.min(completionsInDeck(data, 'deck_deep'), 5),
      target: 5,
    }),
    effect: {
      multiplier: (card) => (card.deck_id === 'deck_deep' ? 1.3 : 1),
    },
  },
  {
    id: 'rare_hunter',
    name: 'Rare Hunter',
    icon: '⭐',
    description: 'Rare and epic cards surface 20% more.',
    hint: 'Complete an epic card (3× overdue or more).',
    progress: (data) => ({
      current: hasEpicCompletion(data) ? 1 : 0,
      target: 1,
    }),
    effect: {
      multiplier: (_card, ctx) => (ctx.overdue_ratio >= 2 ? 1.2 : 1),
    },
  },
];

export function getRelicType(id: string): RelicType | null {
  return RELIC_TYPES.find((r) => r.id === id) ?? null;
}

export function checkRelicEarns(data: AppData, now: number): Relic[] {
  const earned = new Set(data.relics.map((r) => r.type_id));
  const newlyEarned: Relic[] = [];
  for (const type of RELIC_TYPES) {
    if (earned.has(type.id)) continue;
    const p = type.progress(data, now);
    if (p.current >= p.target) {
      newlyEarned.push({
        id: `relic_${type.id}_${now}`,
        type_id: type.id,
        earned_at: now,
      });
    }
  }
  return newlyEarned;
}

export function relicsMultiplier(card: Card, relics: Relic[], ctx: RelicContext): number {
  let m = 1;
  for (const r of relics) {
    const type = getRelicType(r.type_id);
    if (!type?.effect.multiplier) continue;
    m *= type.effect.multiplier(card, ctx);
  }
  return m;
}

export function relicsHandSizeDelta(relics: Relic[], ctx: RelicContext): number {
  let delta = 0;
  for (const r of relics) {
    const type = getRelicType(r.type_id);
    if (!type?.effect.hand_size_delta) continue;
    delta += type.effect.hand_size_delta(ctx);
  }
  return delta;
}
