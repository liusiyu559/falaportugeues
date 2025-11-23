import { HistoryItem } from "../types";

const STORAGE_KEY = 'falabrasil_history_v1';

export const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    // Sort by newest first
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem): void => {
  try {
    const current = getHistory();
    // Avoid duplicates if checking by ID
    const exists = current.find(i => i.id === item.id);
    if (exists) return;

    const updated = [item, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};