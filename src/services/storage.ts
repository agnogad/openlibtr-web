import { HistoryItem, ResumeData, ReadingSettings, AppearanceSettings } from '../types';

const HISTORY_KEY = 'openlib_history';
const RESUME_KEY = 'openlib_resume';
const READING_SETTINGS_KEY = 'openlib_reading_settings';
const APPEARANCE_SETTINGS_KEY = 'openlib_appearance_settings';
const BOOKMARKS_KEY = 'openlib_bookmarks';

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

  removeHistoryItem: (slug: string) => {
    const history = storage.getHistory();
    const newHistory = history.filter(h => h.slug !== slug);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  },

  saveReadingSettings: (settings: ReadingSettings) => {
    localStorage.setItem(READING_SETTINGS_KEY, JSON.stringify(settings));
  },

  getReadingSettings: (): ReadingSettings => {
    const data = localStorage.getItem(READING_SETTINGS_KEY);
    return data ? JSON.parse(data) : { 
      fontSize: 18, 
      fontFamily: 'Lexend',
      backgroundColor: '#000000',
      textColor: '#ffffff'
    };
  },

  saveAppearanceSettings: (settings: AppearanceSettings) => {
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings));
  },

  getAppearanceSettings: (): AppearanceSettings => {
    const data = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
    return data ? JSON.parse(data) : { primaryColor: '#ffffff', theme: 'pitch' };
  },

  getBookmarks: (): any[] => {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addBookmark: (bookmark: any) => {
    const bookmarks = storage.getBookmarks();
    if (!bookmarks.find((b: any) => b.slug === bookmark.slug)) {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([bookmark, ...bookmarks]));
    }
  },

  removeBookmark: (slug: string) => {
    const bookmarks = storage.getBookmarks();
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks.filter((b: any) => b.slug !== slug)));
  },
  
  isBookmarked: (slug: string): boolean => {
    return storage.getBookmarks().some((b: any) => b.slug === slug);
  }
};
