import type { AppData } from '../domain/types';
import { seedData } from './seed';

const KEY = 'zoo_keeper_data_v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedData();
      saveData(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.usage_days) parsed.usage_days = [];
    if (!parsed.card_states) parsed.card_states = {};
    if (!parsed.sessions) parsed.sessions = [];
    return parsed;
  } catch (e) {
    console.error('Failed to load data, reseeding', e);
    const seeded = seedData();
    saveData(seeded);
    return seeded;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function resetData(): AppData {
  const seeded = seedData();
  saveData(seeded);
  return seeded;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
