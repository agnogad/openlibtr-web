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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
    setLoading(true);

    const loadData = async () => {
      try {
        // Try loading from offline first for instant feedback
        const storedNovel = await offlineDB.getNovel(slug);
        if (storedNovel) {
          setConfig(storedNovel.config);
          setNovel(storedNovel.novel);
          setIsDownloaded(true);
          document.title = `${storedNovel.novel.title} | OKUTTUR`;
        }

        // Then try loading from API to get updates
        const [conf, nav] = await Promise.all([
          api.getNovelConfig(slug, true).catch(() => null),
          api.getNovel(slug).catch(() => null)
        ]);

        if (conf) {
          setConfig(conf);
        }
        if (nav) {
          setNovel(nav);
          document.title = `${nav.title} | OKUTTUR`;
        }

        // Re-check update status if we have both config and stored version
        if (storedNovel && (conf || storedNovel.config)) {
          const activeConfig = conf || storedNovel.config;
          const storedPaths = Object.keys(storedNovel.chapters);
          const latestPaths = activeConfig.chapters.map(c => c.path);
          const missing = latestPaths.filter(p => !storedPaths.includes(p));
          setHasNewChapters(missing.length > 0);
          setMissingChapters(missing);
        }

      } catch (error) {
        console.error("Data loading error:", error);
      } finally {
        setHistory(storage.getHistory());
        setResume(storage.getResume());
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handleDownload = async () => {
    if (!config || !novel || !slug) return;
    setDownloading(true);
    
    try {
      const chapters: { [path: string]: string } = {};
      const total = config.chapters.length;
      setDownloadProgress({ current: 0, total });
      
      const CONCURRENCY = 8; // Increased for slightly faster downloads

      for (let i = 0; i < total; i += CONCURRENCY) {
        const chunk = config.chapters.slice(i, i + CONCURRENCY);
        
        await Promise.all(chunk.map(async (ch) => {
          let content = '';
          try {
            content = await api.getChapterContent(slug, ch.path);
          } catch (error) {
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
      alert("Indirme sırasında bir hata oluştu.");
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
      
      const CONCURRENCY = 8;

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
        config,
        chapters: newChapters,
        downloadedAt: Date.now()
      });

      setHasNewChapters(false);
      setMissingChapters([]);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
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

  const filteredChapters = config.chapters
    .filter(ch => 
      ch.id.toString().includes(search) || 
      ch.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
    });

  const totalPages = Math.ceil(filteredChapters.length / pageSize);
  const paginatedChapters = filteredChapters.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col xl:flex-row gap-10 px-4 sm:px-6 max-w-7xl mx-auto pb-32">
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDownload}
        title="İndirmeyi Sil"
        message={`"${novel.title}" çevrimdışı arşivden silinecek. Bölümleri tekrar okumak için internet bağlantısı gerekecek.`}
        confirmText="İndirmeyi Sil"
      />

      {/* Novel Header Info */}
      <div className="w-full xl:w-80 shrink-0">
        <div className="xl:sticky xl:top-10 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[2/3] rounded-[32px] overflow-hidden shadow-2xl border border-brand-border/10 group relative"
          >
            <img src={api.getCoverUrl(config.slug)} alt={novel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" fetchPriority="high" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-[0.2em] mb-1">Durum</span>
                  <span className="text-white text-xs font-lexend font-bold uppercase tracking-widest">Orijinal</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-[0.2em] mb-1">Puan</span>
                  <span className="text-white text-xs font-lexend font-bold uppercase tracking-widest">4.8 / 5</span>
               </div>
            </div>
          </motion.div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-lexend font-bold text-white leading-tight tracking-tight break-words">{novel.title}</h1>
              
              <div className="flex flex-wrap gap-2.5">
                <div className="px-4 py-1.5 rounded-xl bg-brand-primary/10 text-brand-primary text-[10px] font-lexend font-bold uppercase tracking-widest border border-brand-primary/20">
                  {config.total_chapters} BÖLÜM
                </div>
                <div className="px-4 py-1.5 rounded-xl bg-brand-surface-variant/20 text-brand-text-muted text-[10px] font-lexend font-bold uppercase tracking-widest border border-brand-border/10">
                  GÜNCEL
                </div>
                <button 
                  onClick={toggleBookmark}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-lexend font-bold uppercase tracking-widest border flex items-center gap-2 transition-all active:scale-95",
                    bookmarked 
                      ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-lg shadow-red-500/5" 
                      : "bg-surface-variant/10 text-brand-text-muted border-brand-border/20 hover:border-brand-text-muted/30"
                  )}
                >
                  <Heart className={cn("w-3 h-3", bookmarked && "fill-current")} />
                  {bookmarked ? "Favorilerde" : "Favoriye Ekle"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {currentResume ? (
                <Link 
                  to={`/read/${config.slug}/${currentResume.chapterId}`}
                  className="group flex items-center justify-center gap-4 w-full py-5 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-2xl shadow-xl shadow-brand-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  Devam Et (B{currentResume.chapterId})
                </Link>
              ) : (
                <Link 
                  to={`/read/${config.slug}/1`}
                  className="group flex items-center justify-center gap-4 w-full py-5 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-2xl shadow-xl shadow-brand-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Book className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Okumaya Başla
                </Link>
              )}

              <div className="pt-2">
                {!isDownloaded ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={cn(
                      "relative flex items-center justify-center gap-4 w-full py-4.5 rounded-2xl overflow-hidden transition-all group",
                      downloading 
                        ? "bg-brand-surface-variant/40 border border-brand-primary/20 cursor-wait" 
                        : "bg-brand-surface-variant/10 border border-brand-border/20 hover:border-brand-primary/40 hover:bg-brand-primary/5 active:scale-[0.98]"
                    )}
                  >
                    {downloading ? (
                      <>
                        <div 
                          className="absolute inset-y-0 left-0 bg-brand-primary/10 transition-all duration-300 ease-out" 
                          style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                        />
                        <div className="relative flex items-center justify-center gap-3 w-full z-10 py-0.5">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                          <div className="flex flex-col items-start translate-y-[1px]">
                            <span className="text-[10px] font-lexend font-bold text-white tracking-widest uppercase mb-0.5">
                              Arşivleniyor
                            </span>
                            <span className="text-[9px] text-brand-text-muted font-bold uppercase tracking-widest">
                               % {Math.floor((downloadProgress.current / downloadProgress.total) * 100)} TAMAMLANDI
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-bg transition-all duration-300">
                           <Download className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-xs font-lexend font-bold text-white tracking-wide">
                            Çevrimdışı Arşiv
                          </span>
                          <span className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
                            {config.total_chapters} BÖLÜMÜ İNDİR
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
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
                                GÜNCEL ({downloadProgress.current}/{downloadProgress.total})
                             </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <Download className="w-4 h-4 text-brand-primary" />
                             <span className="text-[11px] font-lexend font-bold text-brand-primary tracking-widest uppercase">
                                YENİ {missingChapters.length} BÖLÜM
                             </span>
                          </div>
                        )}
                      </button>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col justify-center px-5 py-3 rounded-2xl bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-0.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                           <span className="text-[10px] font-lexend font-bold text-green-400 tracking-widest uppercase">Hazır</span>
                        </div>
                        <span className="text-[9px] text-brand-text-muted font-bold uppercase tracking-wider">
                           Kütüphanende Kayıtlı
                        </span>
                      </div>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/5"
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
        <div className="m3-card p-6 sm:p-10 border border-brand-border/10 shadow-2xl bg-brand-surface/40">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-6 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/20" />
                  <h2 className="text-3xl font-lexend font-bold text-white tracking-tight">Bölümler</h2>
               </div>
               <p className="text-xs font-lexend text-brand-text-muted uppercase tracking-widest font-bold opacity-60">Toplam {filteredChapters.length} Kayıt</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Başlık veya No..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-brand-surface-variant/20 border border-brand-border/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/40 transition-all font-lexend"
                />
              </div>

              <div className="flex p-1 bg-brand-surface-variant/30 rounded-2xl border border-brand-border/20 w-full sm:w-auto">
                <button 
                  onClick={() => { setSortOrder('asc'); setPage(1); }}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-lexend font-bold transition-all uppercase tracking-widest",
                    sortOrder === 'asc' ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20" : "text-brand-text-muted hover:text-white"
                  )}
                >
                  İlk
                </button>
                <button 
                   onClick={() => { setSortOrder('desc'); setPage(1); }}
                   className={cn(
                    "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[10px] font-lexend font-bold transition-all uppercase tracking-widest",
                    sortOrder === 'desc' ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20" : "text-brand-text-muted hover:text-white"
                  )}
                >
                  Son
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             <AnimatePresence mode="popLayout">
              {paginatedChapters.map((ch, idx) => {
                const isRead = readChapters.has(ch.id);
                const isCurrent = currentResume?.chapterId === ch.id;
                
                return (
                  <motion.div
                    key={ch.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx % pageSize) * 0.01 }}
                  >
                    <Link
                      to={`/read/${slug}/${ch.id}`}
                      className={cn(
                        "relative flex items-center justify-between p-4 rounded-2xl border transition-all group overflow-hidden h-full",
                        isCurrent 
                          ? "bg-brand-primary/10 border-brand-primary/50 ring-2 ring-brand-primary/20" 
                          : isRead 
                            ? "bg-brand-surface-variant/10 border-brand-border/20 group hover:border-brand-primary/30" 
                            : "bg-brand-surface-variant/20 border-brand-border/30 hover:border-brand-primary/50 hover:bg-brand-primary/5 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0 z-10">
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xs font-black transition-all duration-300",
                          isCurrent 
                            ? "bg-brand-primary text-brand-bg rotate-12" 
                            : isRead 
                              ? "bg-brand-surface-variant/30 text-brand-text-muted/60" 
                              : "bg-brand-surface-variant/40 text-white group-hover:bg-brand-primary group-hover:text-brand-bg group-hover:-rotate-12"
                        )}>
                          {ch.id}
                        </div>
                        <div className="flex flex-col min-w-0 pr-4">
                           <span className={cn(
                             "text-[13px] font-lexend font-bold truncate transition-colors",
                             isRead ? "text-brand-text-muted/60 font-normal" : "text-white group-hover:text-brand-primary"
                           )}>
                              {ch.title || `Bölüm ${ch.id}`}
                           </span>
                           {isCurrent && (
                             <span className="text-[9px] font-lexend font-bold text-brand-primary uppercase tracking-[0.2em] mt-0.5">Kaldığın Yer</span>
                           )}
                        </div>
                      </div>
                      
                      <div className="shrink-0 z-10 transition-transform group-hover:translate-x-1 duration-300">
                        {isRead ? (
                           <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                             <Check className="w-3.5 h-3.5 text-green-400" />
                           </div>
                        ) : (
                           <ChevronRight className={cn(
                             "w-5 h-5 transition-colors",
                             isCurrent ? "text-brand-primary" : "text-brand-text-muted group-hover:text-brand-primary"
                           )} />
                        )}
                      </div>

                      {/* Animated Background Indicator for Current Chapter */}
                      {isCurrent && (
                        <motion.div 
                          layoutId="activeChapterGlow"
                          className="absolute inset-0 bg-brand-primary/5 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-10 mt-12 pt-10 border-t border-brand-border/10">
              <button 
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="p-4 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 hover:text-brand-primary transition-all active:scale-90 border border-brand-border/20 shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col items-center gap-1">
                 <span className="text-[10px] font-lexend font-extrabold text-brand-primary uppercase tracking-[0.3em] opacity-80">Sayfa</span>
                 <span className="text-xl font-lexend font-black text-white leading-none">{page} <span className="text-brand-text-muted font-normal text-sm mx-1">/</span> {totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="p-4 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 hover:text-brand-primary transition-all active:scale-90 border border-brand-border/20 shadow-lg"
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
