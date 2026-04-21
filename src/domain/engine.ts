import type { Card, CardState, CompletionLog, DrawFilters, Energy, AppData } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const ENERGY_RANK: Record<Energy, number> = { low: 1, medium: 2, high: 3 };

export const FRESH_THRESHOLD = 0.5;

export function lastCompletedAt(card: Card, completions: CompletionLog[]): number {
  let latest = 0;
  for (const c of completions) {
    if (c.card_id === card.id && c.completed_at > latest) latest = c.completed_at;
  }
  return latest || card.created_at;
}

export function overdueRatio(card: Card, completions: CompletionLog[], now: number): number {
  const last = lastCompletedAt(card, completions);
  const interval = card.target_interval_days * DAY_MS;
  if (interval <= 0) return 0;
  return (now - last) / interval;
}

export function cardWeight(card: Card, completions: CompletionLog[], now: number): number {
  const ratio = overdueRatio(card, completions, now);
  const raw = Math.max(0, ratio - FRESH_THRESHOLD);
  return Math.sqrt(raw);
}

export function filterCards(
  cards: Card[],
  states: Record<string, CardState>,
  filters: DrawFilters,
  now: number,
): Card[] {
  return cards.filter((card) => {
    if (card.parent_card_id) return false;

    const state = states[card.id];
    if (state?.retired_at) return false;
    if (state?.snoozed_until && state.snoozed_until > now) return false;

    if (filters.deck_ids && filters.deck_ids.length > 0) {
      if (!filters.deck_ids.includes(card.deck_id)) return false;
    }

    if (filters.energy_cap) {
      if (ENERGY_RANK[card.energy] > ENERGY_RANK[filters.energy_cap]) return false;
    }

    if (filters.time_of_day && filters.time_of_day !== 'any') {
      if (card.time_of_day !== 'any' && card.time_of_day !== filters.time_of_day) return false;
    }

    if (filters.context && filters.context !== 'anywhere') {
      if (!card.context_tags.includes('anywhere') && !card.context_tags.includes(filters.context)) {
        return false;
      }
    }

    return true;
  });
}

export function weightedSampleWithoutReplacement<T>(
  items: T[],
  weights: number[],
  n: number,
  rng: () => number = Math.random,
): T[] {
  const pool = items.map((item, i) => ({ item, weight: weights[i] }));
  const out: T[] = [];

  while (out.length < n && pool.length > 0) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    if (total <= 0) break;
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) { idx = i; break; }
      idx = i;
    }
    out.push(pool[idx].item);
    pool.splice(idx, 1);
  }

  return out;
}

export interface DrawResult {
  cards: Card[];
  pool_size: number;
}

export function draw(
  data: AppData,
  filters: DrawFilters,
  handSize: number,
  now: number,
  rng: () => number = Math.random,
): DrawResult {
  const pool = filterCards(data.cards, data.card_states, filters, now);
  const weights = pool.map((c) => cardWeight(c, data.completions, now));
  const drawable = pool.filter((_, i) => weights[i] > 0);
  const drawableWeights = weights.filter((w) => w > 0);
  const cards = weightedSampleWithoutReplacement(drawable, drawableWeights, handSize, rng);
  return { cards, pool_size: drawable.length };
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStreak(usageDays: string[], now: number): number {
  if (usageDays.length === 0) return 0;
  const set = new Set(usageDays);
  let streak = 0;
  let cursor = new Date(now);
  const today = dayKey(now);

  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(dayKey(cursor.getTime()))) return 0;
  }

  while (set.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
