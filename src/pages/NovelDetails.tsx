import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Play, Book, Check, Clock, ChevronLeft, ChevronRight, Download, Trash2, Loader2, Heart, HeartOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { Novel, NovelConfig, HistoryItem, ResumeData } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { offlineDB } from '../services/db';
import { ConfirmModal } from '../components/ConfirmModal';

export default function NovelDetails({ session }: { session: Session | null }) {
  const { slug } = useParams();
  const [config, setConfig] = useState<NovelConfig | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [hasNewChapters, setHasNewChapters] = useState(false);
  const [missingChapters, setMissingChapters] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [bookmarked, setBookmarked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const pageSize = 48;

  useEffect(() => {
    if (!slug) return;
    setBookmarked(storage.isBookmarked(slug));
    Promise.all([
      api.getNovelConfig(slug, true),
      api.getNovel(slug),
      offlineDB.getNovel(slug)
    ]).then(([conf, nav, storedNovel]) => {
      setConfig(conf);
      setNovel(nav || null);
      setIsDownloaded(!!storedNovel);
      
      if (storedNovel && conf) {
        const storedPaths = Object.keys(storedNovel.chapters);
        const latestPaths = conf.chapters.map(c => c.path);
        const missing = latestPaths.filter(p => !storedPaths.includes(p));
        setHasNewChapters(missing.length > 0);
        setMissingChapters(missing);
      } else {
        setHasNewChapters(false);
        setMissingChapters([]);
      }

      if (nav) {
        document.title = `${nav.title} | OKUTTUR`;
      }
      setHistory(storage.getHistory());
      setResume(storage.getResume());
      setLoading(false);
    });
  }, [slug]);

  const handleDownload = async () => {
    if (!config || !novel || !slug) return;
    setDownloading(true);
    
    try {
      const chapters: { [path: string]: string } = {};
      const total = config.chapters.length;
      setDownloadProgress({ current: 0, total });
      
      const CONCURRENCY = 5; // Batch 5 chapters at once for fast but safe fetching

      for (let i = 0; i < total; i += CONCURRENCY) {
        const chunk = config.chapters.slice(i, i + CONCURRENCY);
        
        await Promise.all(chunk.map(async (ch) => {
          let content = '';
          try {
            content = await api.getChapterContent(slug, ch.path);
          } catch (error) {
            // Retry once on failure
            console.warn(`Retrying chapter ${ch.id}...`);
            content = await api.getChapterContent(slug, ch.path);
          }
          chapters[ch.path] = content;
        }));

        setDownloadProgress({ current: Math.min(i + CONCURRENCY, total), total });
      }

      await offlineDB.saveNovel({
        slug,
        novel,
        config,
        chapters,
        downloadedAt: Date.now()
      });

      setIsDownloaded(true);
    } catch (error) {
      console.error("Indirme hatası:", error);
      alert("Indirme sırasında bir hata oluştu. Ağ bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!slug) return;
    await offlineDB.deleteNovel(slug);
    setIsDownloaded(false);
    setHasNewChapters(false);
    setMissingChapters([]);
  };

  const handleUpdateDownload = async () => {
    if (!novel || !slug || missingChapters.length === 0) return;
    setDownloading(true);
    
    try {
      const config = await api.getNovelConfig(slug, true);
      const storedNovel = await offlineDB.getNovel(slug);
      if (!storedNovel) throw new Error("Local copy not found");

      const newChapters: { [path: string]: string } = { ...storedNovel.chapters };
      const total = missingChapters.length;
      setDownloadProgress({ current: 0, total });
      
      const CONCURRENCY = 5;

      for (let i = 0; i < total; i += CONCURRENCY) {
        const chunk = missingChapters.slice(i, i + CONCURRENCY);
        
        await Promise.all(chunk.map(async (path) => {
          let content = '';
          try {
            content = await api.getChapterContent(slug, path);
          } catch (error) {
            content = await api.getChapterContent(slug, path);
          }
          newChapters[path] = content;
        }));

        setDownloadProgress({ current: Math.min(i + CONCURRENCY, total), total });
      }

      await offlineDB.saveNovel({
        ...storedNovel,
        config, // Update config to latest
        chapters: newChapters,
        downloadedAt: Date.now()
      });

      setHasNewChapters(false);
      setMissingChapters([]);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setDownloading(false);
    }
  };

  const toggleBookmark = () => {
    if (!slug || !novel) return;
    if (bookmarked) {
      storage.removeBookmark(slug);
      setBookmarked(false);
    } else {
      storage.addBookmark({ slug, title: novel.title, addedAt: Date.now() });
      setBookmarked(true);
    }
  };

  if (loading) return (
    <div className="flex flex-col md:flex-row gap-12 p-6 animate-pulse">
      <div className="w-full md:w-80 h-[480px] bg-brand-surface rounded-[28px]" />
      <div className="flex-1 space-y-8">
        <div className="h-10 bg-brand-surface rounded-full w-2/3" />
        <div className="h-4 bg-brand-surface rounded-full w-1/4" />
        <div className="h-64 bg-brand-surface rounded-[28px]" />
      </div>
    </div>
  );

  if (!config || !novel) return <div className="p-20 text-center text-red-500">Novel bulunamadı.</div>;

  const currentResume = resume?.slug === slug ? resume : null;
  const readChapters = new Set(history.filter(h => h.slug === slug).map(h => h.chapterId));

  const filteredChapters = config.chapters.filter(ch => 
    ch.id.toString().includes(search) || 
    ch.id.toString() === search
  );

  const totalPages = Math.ceil(filteredChapters.length / pageSize);
  const paginatedChapters = filteredChapters.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col md:flex-row gap-12 px-2 sm:px-6">
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDownload}
        title="İndirmeyi Sil"
        message={`"${novel.title}" çevrimdışı arşivden silinecek. Bölümleri tekrar okumak için internet bağlantısı gerekecek.`}
        confirmText="İndirmeyi Sil"
      />

      {/* Novel Header Info */}
      <div className="w-full md:w-80 shrink-0">
        <div className="sticky top-10 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-[2/3] rounded-[28px] overflow-hidden shadow-2xl border border-brand-border/20"
          >
            <img src={api.getCoverUrl(config.slug)} alt={novel.title} className="w-full h-full object-cover" fetchPriority="high" decoding="async" />
          </motion.div>
          
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-4xl font-lexend font-bold text-white leading-tight tracking-tight break-words">{novel.title}</h1>
            
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-1.5 rounded-full bg-brand-primary-container/20 text-brand-primary text-xs font-lexend font-bold uppercase tracking-widest border border-brand-primary/20">
                {config.total_chapters} BÖLÜM
              </div>
              <div className="px-4 py-1.5 rounded-full bg-brand-surface-variant/20 text-brand-text-muted text-xs font-lexend font-bold uppercase tracking-widest border border-brand-border/20">
                GÜNCEL
              </div>
              <button 
                onClick={toggleBookmark}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-lexend font-bold uppercase tracking-widest border flex items-center gap-2 transition-all",
                  bookmarked 
                    ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" 
                    : "bg-surface-variant/20 text-brand-text-muted border-brand-border/20 hover:bg-surface-variant/40"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
                {bookmarked ? "Favorilerde" : "Favoriye Ekle"}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {currentResume ? (
                <Link 
                  to={`/read/${config.slug}/${currentResume.chapterId}`}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Kaldığın Yerden Devam Et (B{currentResume.chapterId})
                </Link>
              ) : (
                <Link 
                  to={`/read/${config.slug}/1`}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Book className="w-5 h-5" />
                  Hemen Oku
                </Link>
              )}

              <div className="pt-2">
                {!isDownloaded ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={cn(
                      "relative flex items-center justify-center gap-3 w-full py-5 rounded-2xl overflow-hidden transition-all group",
                      downloading 
                        ? "bg-brand-surface-variant/40 border border-brand-primary/20 cursor-wait" 
                        : "bg-brand-surface-variant/20 border border-brand-border/30 hover:border-brand-primary/50 hover:bg-brand-primary/10 active:scale-[0.98]"
                    )}
                  >
                    {downloading ? (
                      <>
                        {/* Animated Progress Background */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-brand-primary/20 transition-all duration-300 ease-out" 
                          style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                        />
                        <div className="relative flex items-center justify-center gap-3 w-full z-10">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-[11px] font-lexend font-bold text-white tracking-widest uppercase">
                              İndiriliyor
                            </span>
                            <span className="text-[9px] text-brand-text-muted uppercase tracking-widest">
                              {downloadProgress.current} / {downloadProgress.total} BÖLÜM
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                           <Download className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-xs font-lexend font-bold text-white tracking-wide">
                            Çevrimdışı Oku
                          </span>
                          <span className="text-[10px] text-brand-text-muted uppercase tracking-wider">
                            Cihazına İndir
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {hasNewChapters && (
                      <button
                        onClick={handleUpdateDownload}
                        disabled={downloading}
                        className={cn(
                          "relative flex items-center justify-center gap-3 w-full py-4 rounded-2xl overflow-hidden transition-all group",
                          downloading 
                            ? "bg-brand-primary/20 border border-brand-primary/40 cursor-wait" 
                            : "bg-brand-primary/10 border border-brand-primary/30 hover:bg-brand-primary/20 active:scale-[0.98]"
                        )}
                      >
                        {downloading ? (
                          <div className="flex items-center gap-2">
                             <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                             <span className="text-[11px] font-lexend font-bold text-brand-primary tracking-widest uppercase">
                               GÜNCELLENİYOR ({downloadProgress.current}/{downloadProgress.total})
                             </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <Download className="w-4 h-4 text-brand-primary" />
                             <span className="text-[11px] font-lexend font-bold text-brand-primary tracking-widest uppercase">
                               YENİ BÖLÜMLERİ İNDİR ({missingChapters.length})
                             </span>
                          </div>
                        )}
                      </button>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col justify-center px-5 py-3.5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-0.5">
                           <Check className="w-4 h-4 text-green-400" />
                           <span className="text-[11px] font-lexend font-bold text-green-400 tracking-widest uppercase">İndirildi</span>
                        </div>
                        <span className="text-[9px] text-brand-text-muted uppercase tracking-wider pl-6">
                           Çevrimdışı Okunabilir
                        </span>
                      </div>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center justify-center w-14 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all hover:scale-105 active:scale-95"
                        title="İndirmeyi Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 min-w-0">
        <div className="m3-card p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <h2 className="text-2xl font-lexend font-bold text-white">Bölümler</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                <input 
                  type="text"
                  placeholder="Bölüm Ara..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-brand-surface-variant/20 border border-brand-border/30 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-lexend"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedChapters.map((ch) => {
              const isRead = readChapters.has(ch.id);
              return (
                <Link
                  key={ch.id}
                  to={`/read/${slug}/${ch.id}`}
                  className={cn(
                    "relative flex items-center justify-between p-4 rounded-2xl border transition-all group",
                    isRead 
                      ? "bg-brand-surface-variant/5 border-brand-border/20" 
                      : "bg-brand-surface-variant/10 border-brand-border/40 hover:border-brand-primary/40 hover:bg-brand-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
                      isRead ? "bg-brand-surface-variant/20 text-brand-text-muted" : "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-bg"
                    )}>
                      {ch.id}
                    </div>
                    <span className={cn(
                      "text-sm font-medium truncate pr-4",
                      isRead ? "text-brand-text-muted font-normal" : "text-white font-lexend"
                    )}>{ch.title}</span>
                  </div>
                  {isRead && <Check className="w-4 h-4 text-brand-primary/40 shrink-0" />}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-12 py-6 border-t border-brand-border/10">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-3 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-lexend font-bold text-brand-text-muted uppercase tracking-widest leading-none">SAYFA {page} / {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-3 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
