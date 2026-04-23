import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowUp, Search, Menu, X, Settings, ChevronLeft, ChevronRight, Book, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Session } from '@supabase/supabase-js';
import { Novel, NovelConfig, ReadingSettings } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { syncService } from '../services/sync';
import { cn } from '../lib/utils';
import Giscus from '../components/Giscus';

// --- Helpers ---

const calculateReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return { time, words };
};

export default function Reader({ session }: { session: Session | null }) {
  const { slug, chapterId } = useParams();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [config, setConfig] = useState<NovelConfig | null>(null);
  const [chapter, setChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readerSettings, setReaderSettings] = useState<ReadingSettings>(storage.getReadingSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [chapterPage, setChapterPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const quickPageSize = 60;

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!slug || !chapterId) return;
    setLoading(true);
    
    Promise.all([
      api.getNovelConfig(slug),
      api.getLibrary().then(lib => lib.find(n => n.slug === slug))
    ]).then(([conf, nav]) => {
      setConfig(conf);
      setNovel(nav || null);
      
      const targetCh = conf.chapters.find(c => c.id === parseInt(chapterId));
      if (targetCh) {
        api.getChapterContent(slug, targetCh.path).then(content => {
          setChapter(content);
          setLoading(false);
          if (nav) {
            document.title = `${nav.title} - Bölüm ${chapterId} | OKUTTUR`;
            const historyItem = {
              slug,
              novelTitle: nav.title,
              chapterId: parseInt(chapterId),
              timestamp: Date.now()
            };
            
            storage.saveHistory(historyItem);
            storage.saveResume({
              slug,
              novelTitle: nav.title,
              chapterId: parseInt(chapterId)
            });

            if (session) {
              syncService.saveHistory(session.user.id, historyItem);
            }
          }
        });
      } else {
        setLoading(false);
      }
    });

    window.scrollTo(0, 0);
  }, [slug, chapterId, session]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-brand-bg z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-text-muted font-lexend font-medium text-sm animate-pulse">Bölüm Hazırlanıyor...</p>
      </div>
    </div>
  );

  if (!novel || !config) return null;

  const currentIdx = config.chapters.findIndex(c => c.id === parseInt(chapterId!));
  const prevCh = config.chapters[currentIdx - 1];
  const nextCh = config.chapters[currentIdx + 1];

  const htmlContent = DOMPurify.sanitize(marked.parse(chapter) as string);
  const { time, words } = calculateReadingTime(chapter);

  const filteredQuickChapters = config.chapters.filter(ch => 
    ch.id.toString().includes(chapterSearch) || 
    ch.id.toString() === chapterSearch
  );

  const quickTotalPages = Math.ceil(filteredQuickChapters.length / quickPageSize);
  const paginatedQuickChapters = filteredQuickChapters.slice((chapterPage - 1) * quickPageSize, chapterPage * quickPageSize);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-brand-primary z-[60] transition-all duration-150" 
        style={{ width: `${scrollProgress}%` }}
      />
      
      <nav className="glass-header h-16 flex items-center shrink-0 border-b border-brand-border/20 content-visibility-auto">
        <div className="container mx-auto px-2 sm:px-4 flex items-center justify-between gap-2">
          <Link 
            to={`/novel/${slug}`}
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full hover:bg-brand-surface-variant/30 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-brand-text-main" />
          </Link>
          
          <div className="flex-1 min-w-0 px-2 text-center">
            <h2 className="text-xs sm:text-sm font-lexend font-bold text-white truncate max-w-[180px] sm:max-w-none mx-auto">{novel.title}</h2>
            <p className="text-[10px] sm:text-[11px] text-brand-primary font-bold uppercase tracking-widest leading-none mt-1">BÖLÜM {chapterId}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => setShowChapters(!showChapters)}
              className={cn(
                "p-2 rounded-full transition-all",
                showChapters ? "bg-brand-primary text-brand-bg" : "text-brand-text-main hover:bg-brand-surface-variant/20"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-full transition-all",
                showSettings ? "bg-brand-primary text-brand-bg" : "text-brand-text-main hover:bg-brand-surface-variant/20"
              )}
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showChapters && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 z-40 bg-brand-surface border-b border-brand-border/30 shadow-2xl"
            >
              <div className="container mx-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-lexend font-bold text-white uppercase tracking-wider">Hızlı Erişim</h3>
                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">
                      {filteredQuickChapters.length} BÖLÜM
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input 
                        type="text"
                        placeholder="Bölüm Ara..."
                        value={chapterSearch}
                        onChange={(e) => {
                          setChapterSearch(e.target.value);
                          setChapterPage(1);
                        }}
                        className="bg-brand-surface-variant/20 border-none rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder:text-brand-text-muted focus:ring-1 focus:ring-brand-primary/30 transition-all font-lexend w-40 sm:w-60"
                      />
                    </div>
                    <button onClick={() => setShowChapters(false)} className="p-2 rounded-full hover:bg-brand-surface-variant/30 hidden sm:block">
                      <X className="w-5 h-5 text-brand-text-muted" />
                    </button>
                    <button onClick={() => setShowChapters(false)} className="sm:hidden p-2 text-brand-text-muted">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {paginatedQuickChapters.map((ch) => {
                    const isCurrent = ch.id === parseInt(chapterId!);
                    return (
                      <Link
                        key={ch.id}
                        to={`/read/${slug}/${ch.id}`}
                        onClick={() => setShowChapters(false)}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg border text-xs font-bold transition-all",
                          isCurrent
                            ? "bg-brand-primary text-brand-bg border-brand-primary shadow-sm"
                            : "bg-brand-surface-variant/5 text-brand-text-muted border-brand-border/40 hover:border-brand-primary/40 hover:text-white"
                        )}
                      >
                        {ch.id}
                      </Link>
                    )
                  })}

                  {filteredQuickChapters.length === 0 && (
                    <div className="col-span-full py-10 text-center">
                      <p className="text-brand-text-muted font-lexend text-sm">Bölüm bulunamadı.</p>
                    </div>
                  )}
                </div>

                {quickTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-brand-border/10">
                    <button 
                      disabled={chapterPage === 1}
                      onClick={() => setChapterPage(p => p - 1)}
                      className="p-1.5 rounded-lg bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 hover:text-brand-primary transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-widest leading-none">
                      SAYFA {chapterPage} / {quickTotalPages}
                    </span>
                    <button 
                      disabled={chapterPage === quickTotalPages}
                      onClick={() => setChapterPage(p => p + 1)}
                      className="p-1.5 rounded-lg bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 hover:text-brand-primary transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-0 right-0 z-40 bg-brand-surface border-b border-brand-border/30 p-8 shadow-xl"
            >
              <div className="container mx-auto max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-lexend font-bold text-brand-text-muted uppercase tracking-wider">Metin Boyutu</label>
                    <span className="text-brand-primary font-bold text-sm">{readerSettings.fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="14" 
                    max="32" 
                    value={readerSettings.fontSize} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const newSettings = { ...readerSettings, fontSize: val };
                      setReaderSettings(newSettings);
                      storage.saveReadingSettings(newSettings);
                    }}
                    className="w-full accent-brand-primary cursor-pointer h-2 bg-brand-surface-variant/30 rounded-full appearance-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-lexend font-bold text-brand-text-muted uppercase tracking-wider mb-4 block">Metin Fontu</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Lexend', 'Inter', 'Serif', 'Mono'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => {
                          const newSettings = { ...readerSettings, fontFamily: font };
                          setReaderSettings(newSettings);
                          storage.saveReadingSettings(newSettings);
                        }}
                        className={cn(
                          "py-3 text-[13px] font-lexend font-medium rounded-2xl border transition-all",
                          readerSettings.fontFamily === font
                            ? "bg-brand-primary text-brand-bg border-brand-primary"
                            : "bg-brand-surface-variant/10 text-brand-text-muted border-brand-border/40 hover:text-white"
                        )}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl relative">
        {/* Reading Meta */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-lexend font-bold text-brand-text-muted uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5 text-brand-primary" />
              {time} Dakika Okuma
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-lexend font-bold text-brand-text-muted uppercase tracking-widest">
              <Book className="w-3.5 h-3.5 text-brand-primary" />
              {words} Kelime
            </div>
          </div>
          <div className="text-[10px] sm:text-xs font-mono text-brand-primary/60">
            {Math.round(scrollProgress)}% BİTTİ
          </div>
        </div>

        <article 
          className={cn(
            "markdown-body transition-all leading-relaxed",
            readerSettings.fontFamily === 'Lexend' && "font-lexend",
            readerSettings.fontFamily === 'Inter' && "font-sans",
            readerSettings.fontFamily === 'Serif' && "font-serif",
            readerSettings.fontFamily === 'Mono' && "font-mono"
          )}
          style={{ fontSize: `${readerSettings.fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-20 pt-10 border-t border-brand-border/10">
          {prevCh ? (
            <Link 
              to={`/read/${slug}/${prevCh.id}`}
              className="flex items-center gap-3 px-8 py-4 bg-brand-surface-variant/20 rounded-2xl text-white font-lexend font-bold text-sm tracking-wide hover:bg-brand-surface-variant/40 transition-all w-full sm:w-auto"
            >
              <ChevronLeft className="w-5 h-5" />
              Önceki Bölüm
            </Link>
          ) : <div className="hidden sm:block" />}
          
          {nextCh ? (
            <Link 
              to={`/read/${slug}/${nextCh.id}`}
              className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-brand-bg rounded-2xl font-lexend font-bold text-sm tracking-wide hover:brightness-110 transition-all w-full sm:w-auto shadow-lg"
            >
              Sonraki Bölüm
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : <div className="hidden sm:block" />}
        </div>

        <Giscus slug={slug!} chapterId={parseInt(chapterId!)} />
      </main>

      <footer className="py-12 border-t border-brand-border/10 bg-brand-surface/20 text-center">
        <p className="text-[11px] font-lexend font-bold tracking-widest text-brand-text-muted uppercase">
          &copy; 2026 OKUTTUR &bull; Dark Mode Material Experience
        </p>
      </footer>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 sm:bottom-10 sm:right-10 w-12 h-12 bg-brand-primary text-brand-bg rounded-full shadow-2xl flex items-center justify-center z-40 hover:brightness-110 active:scale-90 transition-all border-4 border-brand-bg"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
