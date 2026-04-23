import { Novel, NovelConfig } from '../types';

const BASE_URL = 'https://raw.githubusercontent.com/agnogad/openlibtr/main';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  timestamp: number;
  data: T;
}

const cache: { [key: string]: CachedData<any> } = {};

const fetchWithCache = async <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const cached = cache[key];

  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  const data = await fetchFn();
  cache[key] = { timestamp: now, data };
  return data;
};

export const api = {
  getLibrary: async (): Promise<Novel[]> => {
    return fetchWithCache('library', async () => {
      const response = await fetch(`${BASE_URL}/library.json`);
      if (!response.ok) throw new Error('Could not fetch library');
      return response.json();
    });
  },

  getNovelConfig: async (slug: string): Promise<NovelConfig> => {
    return fetchWithCache(`config-${slug}`, async () => {
      const response = await fetch(`${BASE_URL}/books/${slug}/config.json`);
      if (!response.ok) throw new Error('Could not fetch novel config');
      return response.json();
    });
  },

  getChapterContent: async (slug: string, path: string): Promise<string> => {
    // We don't cache chapter content as requested specifically for JSON "requests" (plural), 
    // chapters are larger and usually only loaded once per session per chapter.
    const response = await fetch(`${BASE_URL}/books/${slug}/${path}`);
    if (!response.ok) throw new Error('Could not fetch chapter content');
    return response.text();
  },

  getCoverUrl: (slug: string): string => {
    const originalUrl = `${BASE_URL}/books/${slug}/cover.jpg`;
    return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=400&output=webp&q=80`;
  }
};
