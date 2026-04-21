export type Energy = 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'any';
export type ContextTag = 'home' | 'out' | 'errand' | 'anywhere';

export interface Deck {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Card {
  id: string;
  deck_id: string;
  title: string;
  notes: string;
  target_interval_days: number;
  energy: Energy;
  duration_minutes: number;
  time_of_day: TimeOfDay;
  context_tags: ContextTag[];
  parent_card_id: string | null;
  created_at: number;
}

export interface CompletionLog {
  id: string;
  card_id: string;
  completed_at: number;
}

export interface CardState {
  card_id: string;
  snoozed_until: number | null;
  retired_at: number | null;
}

export interface DrawSession {
  id: string;
  started_at: number;
  filters: DrawFilters;
  cards_offered: string[];
  card_chosen_id: string | null;
}

export interface DrawFilters {
  deck_ids: string[] | null;
  energy_cap?: Energy;
  time_of_day?: TimeOfDay;
  context?: ContextTag;
}

export interface AppData {
  decks: Deck[];
  cards: Card[];
  completions: CompletionLog[];
  card_states: Record<string, CardState>;
  sessions: DrawSession[];
  usage_days: string[];
}
