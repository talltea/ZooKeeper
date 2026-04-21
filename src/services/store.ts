import { writable } from 'svelte/store';
import type { AppData, Card, DrawFilters, DrawSession } from '../domain/types';
import { loadData, saveData, uid } from '../persistence/storage';
import { dayKey, draw as engineDraw } from '../domain/engine';
import { archetypeMultiplier, getArchetype } from '../domain/archetypes';

export const data = writable<AppData>(loadData());

let current: AppData = loadData();
data.subscribe((v) => { current = v; });

function commit(next: AppData): void {
  saveData(next);
  data.set(next);
}

export function markUsageToday(): void {
  const today = dayKey(Date.now());
  if (current.usage_days.includes(today)) return;
  commit({ ...current, usage_days: [...current.usage_days, today] });
}

export function createDraw(filters: DrawFilters, handSize = 3): { session: DrawSession; cards: Card[]; poolSize: number } {
  markUsageToday();
  const now = Date.now();
  const archetype = getArchetype(current.archetype_id);
  const effectiveHand = archetype?.hand_size ?? handSize;
  const multiplier = archetype ? (c: Card) => archetypeMultiplier(c, archetype) : undefined;
  const result = engineDraw(current, filters, effectiveHand, now, Math.random, multiplier);
  const session: DrawSession = {
    id: uid(),
    started_at: now,
    filters,
    cards_offered: result.cards.map((c) => c.id),
    card_chosen_id: null,
  };
  commit({ ...current, sessions: [...current.sessions, session] });
  return { session, cards: result.cards, poolSize: result.pool_size };
}

export function setArchetype(id: string | null): void {
  commit({ ...current, archetype_id: id });
}

export function completeCard(cardId: string, sessionId?: string): void {
  const now = Date.now();
  const completion = { id: uid(), card_id: cardId, completed_at: now };
  let sessions = current.sessions;
  if (sessionId) {
    sessions = sessions.map((s) => s.id === sessionId ? { ...s, card_chosen_id: cardId } : s);
  }
  commit({ ...current, completions: [...current.completions, completion], sessions });
}

export function snoozeCard(cardId: string, days: number): void {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  const states = { ...current.card_states, [cardId]: { card_id: cardId, snoozed_until: until, retired_at: current.card_states[cardId]?.retired_at ?? null } };
  commit({ ...current, card_states: states });
}

export function retireCard(cardId: string): void {
  const states = { ...current.card_states, [cardId]: { card_id: cardId, snoozed_until: current.card_states[cardId]?.snoozed_until ?? null, retired_at: Date.now() } };
  commit({ ...current, card_states: states });
}

export function deleteCard(cardId: string): void {
  commit({
    ...current,
    cards: current.cards.filter((c) => c.id !== cardId),
    completions: current.completions.filter((c) => c.card_id !== cardId),
    card_states: Object.fromEntries(Object.entries(current.card_states).filter(([k]) => k !== cardId)),
  });
}

export function upsertCard(card: Card): void {
  const exists = current.cards.some((c) => c.id === card.id);
  const cards = exists ? current.cards.map((c) => c.id === card.id ? card : c) : [...current.cards, card];
  commit({ ...current, cards });
}

export function newCard(deckId: string): Card {
  return {
    id: uid(),
    deck_id: deckId,
    title: '',
    notes: '',
    target_interval_days: 7,
    energy: 'medium',
    duration_minutes: 15,
    time_of_day: 'any',
    context_tags: ['home'],
    parent_card_id: null,
    created_at: Date.now(),
  };
}
