import { openDB, IDBPDatabase } from 'idb';
import { Novel, NovelConfig } from '../types';

const DB_NAME = 'okuttur-offline';
const STORE_NAME = 'downloads';
const VERSION = 1;

export interface DownloadedNovel {
  slug: string;
  novel: Novel;
  config: NovelConfig;
  chapters: { [path: string]: string };
  downloadedAt: number;
}

class OfflineDB {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slug' });
        }
      },
    });
  }

  async saveNovel(download: DownloadedNovel) {
    const db = await this.dbPromise;
    return db.put(STORE_NAME, download);
  }

  async getNovel(slug: string): Promise<DownloadedNovel | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, slug);
  }

  async getAllNovels(): Promise<DownloadedNovel[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async deleteNovel(slug: string) {
    const db = await this.dbPromise;
    return db.delete(STORE_NAME, slug);
  }

  async isDownloaded(slug: string): Promise<boolean> {
    const novel = await this.getNovel(slug);
    return !!novel;
  }
}

export const offlineDB = new OfflineDB();
