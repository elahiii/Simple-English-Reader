import type { HistoryEntry, Settings } from '../types';

const HISTORY_KEY = 'ser_history';
const SETTINGS_KEY = 'ser_settings';
const MAX_HISTORY = 50;

export const defaultSettings: Settings = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  theme: 'light',
  autoShowPopup: true,
};

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTINGS_KEY, (result) => {
      resolve({ ...defaultSettings, ...(result[SETTINGS_KEY] ?? {}) });
    });
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, resolve);
  });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(HISTORY_KEY, (result) => {
      resolve(result[HISTORY_KEY] ?? []);
    });
  });
}

export async function addToHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_KEY]: updated }, resolve);
  });
}

export async function deleteFromHistory(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter((e) => e.id !== id);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_KEY]: updated }, resolve);
  });
}

export async function clearHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(HISTORY_KEY, resolve);
  });
}
