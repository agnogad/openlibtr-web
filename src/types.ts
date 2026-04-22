export interface Novel {
  title: string;
  slug: string;
  chapterCount: number;
  lastUpdated: string;
}

export interface Chapter {
  id: number;
  title: string;
  path: string;
}

export interface NovelConfig {
  slug: string;
  total_chapters: number;
  chapters: Chapter[];
}

export interface HistoryItem {
  slug: string;
  novelTitle: string;
  chapterId: number;
  timestamp: number;
}

export interface ResumeData {
  slug: string;
  novelTitle: string;
  chapterId: number;
}

export interface ReadingSettings {
  fontSize: number;
  fontFamily: 'Lexend' | 'Inter' | 'Serif' | 'Mono';
}

export interface AppearanceSettings {
  primaryColor: string;
  theme: 'material' | 'pitch' | 'deep' | 'forest';
}
