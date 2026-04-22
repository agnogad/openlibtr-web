import { HistoryItem, ResumeData, ReadingSettings, AppearanceSettings } from '../types';

const HISTORY_KEY = 'openlib_history';
const RESUME_KEY = 'openlib_resume';
const READING_SETTINGS_KEY = 'openlib_reading_settings';
const APPEARANCE_SETTINGS_KEY = 'openlib_appearance_settings';

export const storage = {
  // ... existing methods ...
  saveHistory: (item: HistoryItem) => {
    const history = storage.getHistory();
    // Filter out previous entries for the same novel to avoid duplicates
    const filteredHistory = history.filter(h => h.slug !== item.slug);
    const newHistory = [item, ...filteredHistory].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  },

  getHistory: (): HistoryItem[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveResume: (data: ResumeData) => {
    localStorage.setItem(RESUME_KEY, JSON.stringify(data));
  },

  getResume: (): ResumeData | null => {
    const data = localStorage.getItem(RESUME_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  },

  saveReadingSettings: (settings: ReadingSettings) => {
    localStorage.setItem(READING_SETTINGS_KEY, JSON.stringify(settings));
  },

  getReadingSettings: (): ReadingSettings => {
    const data = localStorage.getItem(READING_SETTINGS_KEY);
    return data ? JSON.parse(data) : { fontSize: 18, fontFamily: 'Lexend' };
  },

  saveAppearanceSettings: (settings: AppearanceSettings) => {
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
  },

  getAppearanceSettings: (): AppearanceSettings => {
    const data = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
    return data ? JSON.parse(data) : { primaryColor: '#c4c6d0', theme: 'pitch' };
  }
};
