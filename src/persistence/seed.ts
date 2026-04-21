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
    mk(6, 'deck_upkeep', 'Wipe counters', { target_interval_days: 2, energy: 'low', duration_minutes: 5 }),
    mk(7, 'deck_upkeep', 'Make the bed', { target_interval_days: 1, energy: 'low', duration_minutes: 3, time_of_day: 'morning' }),
    mk(8, 'deck_upkeep', 'Vacuum living room', { target_interval_days: 7, energy: 'medium', duration_minutes: 20 }),
    mk(9, 'deck_upkeep', 'Clean bathroom sink', { target_interval_days: 5, energy: 'low', duration_minutes: 10 }),
    mk(50, 'deck_upkeep', 'Scrub toilet', { target_interval_days: 7, energy: 'medium', duration_minutes: 15 }),
    mk(51, 'deck_upkeep', 'Mop floors', { target_interval_days: 10, energy: 'medium', duration_minutes: 30 }),
    mk(52, 'deck_upkeep', 'Change bed sheets', { target_interval_days: 14, energy: 'medium', duration_minutes: 15 }),
    mk(53, 'deck_upkeep', 'Tidy entryway', { target_interval_days: 3, energy: 'low', duration_minutes: 10 }),
    mk(54, 'deck_upkeep', 'Empty dishwasher', { target_interval_days: 2, energy: 'low', duration_minutes: 5 }),
    mk(55, 'deck_upkeep', 'Clean fridge shelves', { target_interval_days: 21, energy: 'medium', duration_minutes: 25 }),
    mk(56, 'deck_upkeep', 'Take out recycling', { target_interval_days: 7, energy: 'low', duration_minutes: 10 }),
    mk(57, 'deck_upkeep', 'Wipe down appliances', { target_interval_days: 10, energy: 'low', duration_minutes: 10 }),
    mk(58, 'deck_upkeep', 'Dust surfaces', { target_interval_days: 10, energy: 'low', duration_minutes: 20 }),
    mk(59, 'deck_upkeep', 'Clean mirrors', { target_interval_days: 14, energy: 'low', duration_minutes: 10 }),

    mk(10, 'deck_admin', 'Pay bills', { target_interval_days: 14, energy: 'medium', duration_minutes: 20 }),
    mk(11, 'deck_admin', 'File receipts', { target_interval_days: 30, energy: 'low', duration_minutes: 15 }),
    mk(12, 'deck_admin', 'Review calendar for next week', { target_interval_days: 7, energy: 'low', duration_minutes: 10 }),
    mk(13, 'deck_admin', 'Check bank statements', { target_interval_days: 14, energy: 'medium', duration_minutes: 20 }),
    mk(14, 'deck_admin', 'Update budget', { target_interval_days: 30, energy: 'medium', duration_minutes: 30 }),
    mk(15, 'deck_admin', 'Backup phone photos', { target_interval_days: 30, energy: 'low', duration_minutes: 15 }),
    mk(16, 'deck_admin', 'Inbox zero sweep', { target_interval_days: 7, energy: 'medium', duration_minutes: 30 }),
    mk(17, 'deck_admin', 'Review subscriptions', { target_interval_days: 60, energy: 'medium', duration_minutes: 20 }),
    mk(18, 'deck_admin', 'Renew prescriptions', { target_interval_days: 30, energy: 'low', duration_minutes: 10 }),
    mk(19, 'deck_admin', 'Schedule dentist visit', { target_interval_days: 180, energy: 'low', duration_minutes: 10 }),
    mk(60, 'deck_admin', 'Check car registration', { target_interval_days: 90, energy: 'low', duration_minutes: 10 }),
    mk(61, 'deck_admin', 'Update passwords', { target_interval_days: 90, energy: 'medium', duration_minutes: 20 }),
    mk(62, 'deck_admin', 'Tax folder tidy', { target_interval_days: 30, energy: 'low', duration_minutes: 15 }),
    mk(63, 'deck_admin', 'Review goals', { target_interval_days: 30, energy: 'medium', duration_minutes: 30 }),

    mk(20, 'deck_deep', 'Clean oven', { target_interval_days: 90, energy: 'high', duration_minutes: 60 }),
    mk(21, 'deck_deep', 'Closet purge', { target_interval_days: 120, energy: 'high', duration_minutes: 90 }),
    mk(22, 'deck_deep', 'Wash windows', { target_interval_days: 60, energy: 'medium', duration_minutes: 45 }),
    mk(23, 'deck_deep', 'Descale kettle', { target_interval_days: 60, energy: 'low', duration_minutes: 15 }),
    mk(24, 'deck_deep', 'Clean fridge thoroughly', { target_interval_days: 60, energy: 'high', duration_minutes: 60 }),
    mk(25, 'deck_deep', 'Scrub grout', { target_interval_days: 120, energy: 'high', duration_minutes: 90 }),
    mk(26, 'deck_deep', 'Clean behind furniture', { target_interval_days: 90, energy: 'high', duration_minutes: 60 }),
    mk(27, 'deck_deep', 'Wash curtains', { target_interval_days: 180, energy: 'medium', duration_minutes: 45 }),
    mk(28, 'deck_deep', 'Rotate mattress', { target_interval_days: 90, energy: 'medium', duration_minutes: 15 }),
    mk(29, 'deck_deep', 'Clean dryer vent', { target_interval_days: 180, energy: 'medium', duration_minutes: 30 }),
    mk(70, 'deck_deep', 'Dust ceiling fans', { target_interval_days: 90, energy: 'medium', duration_minutes: 20 }),
    mk(71, 'deck_deep', 'Deep clean bathroom', { target_interval_days: 30, energy: 'high', duration_minutes: 60 }),
    mk(72, 'deck_deep', 'Organize pantry', { target_interval_days: 90, energy: 'medium', duration_minutes: 45 }),
    mk(73, 'deck_deep', 'Shampoo carpets', { target_interval_days: 180, energy: 'high', duration_minutes: 120 }),
    mk(74, 'deck_deep', 'Clean light fixtures', { target_interval_days: 120, energy: 'medium', duration_minutes: 30 }),

    mk(30, 'deck_self', 'Stretch 10 minutes', { target_interval_days: 2, energy: 'low', duration_minutes: 10 }),
    mk(31, 'deck_self', 'Meal prep', { target_interval_days: 7, energy: 'medium', duration_minutes: 60 }),
    mk(32, 'deck_self', 'Early sleep night', { target_interval_days: 5, energy: 'low', duration_minutes: 5, time_of_day: 'evening' }),
    mk(33, 'deck_self', 'Go for a walk', { target_interval_days: 2, energy: 'low', duration_minutes: 30, context_tags: ['out'] }),
    mk(34, 'deck_self', 'Journal entry', { target_interval_days: 2, energy: 'low', duration_minutes: 15, time_of_day: 'evening' }),
    mk(35, 'deck_self', 'Meditate', { target_interval_days: 1, energy: 'low', duration_minutes: 10, time_of_day: 'morning' }),
    mk(36, 'deck_self', 'Strength workout', { target_interval_days: 3, energy: 'high', duration_minutes: 45 }),
    mk(37, 'deck_self', 'Cardio session', { target_interval_days: 3, energy: 'high', duration_minutes: 30 }),
    mk(38, 'deck_self', 'No-screen evening', { target_interval_days: 7, energy: 'low', duration_minutes: 120, time_of_day: 'evening' }),
    mk(39, 'deck_self', 'Skin care routine', { target_interval_days: 1, energy: 'low', duration_minutes: 10, time_of_day: 'evening' }),
    mk(80, 'deck_self', 'Drink 8 glasses of water', { target_interval_days: 1, energy: 'low', duration_minutes: 5 }),
    mk(81, 'deck_self', 'Cook a new recipe', { target_interval_days: 14, energy: 'medium', duration_minutes: 90 }),
    mk(82, 'deck_self', 'Take vitamins', { target_interval_days: 1, energy: 'low', duration_minutes: 2, time_of_day: 'morning' }),
    mk(83, 'deck_self', 'Long bath', { target_interval_days: 10, energy: 'low', duration_minutes: 60, time_of_day: 'evening' }),
    mk(84, 'deck_self', 'Yoga session', { target_interval_days: 3, energy: 'medium', duration_minutes: 30 }),

    mk(40, 'deck_fun', 'Try a new coffee shop', { target_interval_days: 14, energy: 'low', duration_minutes: 60, context_tags: ['out'] }),
    mk(41, 'deck_fun', 'Call a friend', { target_interval_days: 10, energy: 'low', duration_minutes: 30, context_tags: ['anywhere'] }),
    mk(42, 'deck_fun', 'Read 20 pages', { target_interval_days: 2, energy: 'low', duration_minutes: 30 }),
    mk(43, 'deck_fun', 'Watch a classic film', { target_interval_days: 14, energy: 'low', duration_minutes: 120, time_of_day: 'evening' }),
    mk(44, 'deck_fun', 'Visit a museum', { target_interval_days: 30, energy: 'medium', duration_minutes: 120, context_tags: ['out'] }),
    mk(45, 'deck_fun', 'Hand-write a letter', { target_interval_days: 30, energy: 'low', duration_minutes: 30 }),
    mk(46, 'deck_fun', 'Try a new restaurant', { target_interval_days: 21, energy: 'low', duration_minutes: 90, context_tags: ['out'] }),
    mk(47, 'deck_fun', 'Take photos on a walk', { target_interval_days: 14, energy: 'low', duration_minutes: 60, context_tags: ['out'] }),
    mk(48, 'deck_fun', 'Board game night', { target_interval_days: 21, energy: 'medium', duration_minutes: 120, time_of_day: 'evening' }),
    mk(49, 'deck_fun', 'Learn something on YouTube', { target_interval_days: 7, energy: 'low', duration_minutes: 30 }),
    mk(90, 'deck_fun', 'Cook something ambitious', { target_interval_days: 30, energy: 'high', duration_minutes: 180 }),
    mk(91, 'deck_fun', 'Go to farmer\'s market', { target_interval_days: 14, energy: 'low', duration_minutes: 60, context_tags: ['out'] }),
    mk(92, 'deck_fun', 'Sketch for 20 minutes', { target_interval_days: 5, energy: 'low', duration_minutes: 20 }),
    mk(93, 'deck_fun', 'Visit a park', { target_interval_days: 10, energy: 'low', duration_minutes: 90, context_tags: ['out'] }),
    mk(94, 'deck_fun', 'Play an instrument', { target_interval_days: 3, energy: 'low', duration_minutes: 20 }),
    mk(95, 'deck_fun', 'Puzzle time', { target_interval_days: 14, energy: 'low', duration_minutes: 45 }),
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
