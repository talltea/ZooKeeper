import type { AppData, Card, Deck } from '../domain/types';

function id(prefix: string, n: number): string {
  return `${prefix}_${n}`;
}

export function seedData(): AppData {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const decks: Deck[] = [
    { id: 'deck_upkeep', name: 'Upkeep', icon: '🧹', color: '#6ddb9c' },
    { id: 'deck_admin', name: 'Admin', icon: '📋', color: '#9d7fe8' },
    { id: 'deck_deep', name: 'Deep clean', icon: '🧼', color: '#5ab0f7' },
    { id: 'deck_self', name: 'Self-care', icon: '🌿', color: '#e8c97f' },
    { id: 'deck_fun', name: 'Side quests', icon: '✨', color: '#e85a8a' },
  ];

  const mk = (
    n: number,
    deck_id: string,
    title: string,
    opts: Partial<Card> = {},
  ): Card => ({
    id: id('card', n),
    deck_id,
    title,
    notes: '',
    target_interval_days: 7,
    energy: 'medium',
    duration_minutes: 15,
    time_of_day: 'any',
    context_tags: ['home'],
    parent_card_id: null,
    created_at: now - 30 * DAY,
    ...opts,
  });

  const cards: Card[] = [
    mk(1, 'deck_upkeep', 'Do the dishes', { target_interval_days: 1, energy: 'low', duration_minutes: 10 }),
    mk(2, 'deck_upkeep', 'Laundry', { target_interval_days: 7, energy: 'medium', duration_minutes: 45 }),
    mk(3, 'deck_upkeep', 'Water plants', { target_interval_days: 4, energy: 'low', duration_minutes: 5 }),
    mk(4, 'deck_upkeep', 'Take out trash', { target_interval_days: 3, energy: 'low', duration_minutes: 5 }),
    mk(5, 'deck_upkeep', 'Sweep kitchen', { target_interval_days: 5, energy: 'low', duration_minutes: 10 }),

    mk(10, 'deck_admin', 'Pay bills', { target_interval_days: 14, energy: 'medium', duration_minutes: 20 }),
    mk(11, 'deck_admin', 'File receipts', { target_interval_days: 30, energy: 'low', duration_minutes: 15 }),
    mk(12, 'deck_admin', 'Review calendar for next week', { target_interval_days: 7, energy: 'low', duration_minutes: 10 }),

    mk(20, 'deck_deep', 'Clean oven', { target_interval_days: 90, energy: 'high', duration_minutes: 60 }),
    mk(21, 'deck_deep', 'Closet purge', { target_interval_days: 120, energy: 'high', duration_minutes: 90 }),
    mk(22, 'deck_deep', 'Wash windows', { target_interval_days: 60, energy: 'medium', duration_minutes: 45 }),

    mk(30, 'deck_self', 'Stretch 10 minutes', { target_interval_days: 2, energy: 'low', duration_minutes: 10 }),
    mk(31, 'deck_self', 'Meal prep', { target_interval_days: 7, energy: 'medium', duration_minutes: 60 }),
    mk(32, 'deck_self', 'Early sleep night', { target_interval_days: 5, energy: 'low', duration_minutes: 5, time_of_day: 'evening' }),

    mk(40, 'deck_fun', 'Try a new coffee shop', { target_interval_days: 14, energy: 'low', duration_minutes: 60, context_tags: ['out'] }),
    mk(41, 'deck_fun', 'Call a friend', { target_interval_days: 10, energy: 'low', duration_minutes: 30, context_tags: ['anywhere'] }),
    mk(42, 'deck_fun', 'Read 20 pages', { target_interval_days: 2, energy: 'low', duration_minutes: 30 }),
  ];

  return {
    decks,
    cards,
    completions: [],
    card_states: {},
    sessions: [],
    usage_days: [],
  };
}
