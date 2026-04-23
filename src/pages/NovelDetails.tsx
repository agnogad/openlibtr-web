import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Play, Book, Check, Clock, ChevronLeft, ChevronRight, Download, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { Novel, NovelConfig, HistoryItem, ResumeData } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { offlineDB } from '../services/db';

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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const pageSize = 48;

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.getNovelConfig(slug),
      api.getNovel(slug),
      offlineDB.isDownloaded(slug)
    ]).then(([conf, nav, downloaded]) => {
      setConfig(conf);
      setNovel(nav || null);
      setIsDownloaded(downloaded);
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
    setDownloadProgress(0);

    try {
      const chapters: { [path: string]: string } = {};
      const total = config.chapters.length;

      for (let i = 0; i < total; i++) {
        const ch = config.chapters[i];
        const content = await api.getChapterContent(slug, ch.path);
        chapters[ch.path] = content;
        setDownloadProgress(Math.round(((i + 1) / total) * 100));
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
      alert("Indirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteDownload = async () => {
    if (!slug) return;
    if (confirm("Bu noveli indirlenlerden silmek istediğinize emin misiniz?")) {
      await offlineDB.deleteNovel(slug);
      setIsDownloaded(false);
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

              {session && (
                <div className="pt-2">
                  {!isDownloaded ? (
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className={cn(
                        "flex items-center justify-center gap-3 w-full py-4 border border-brand-primary text-brand-primary font-lexend font-bold text-xs tracking-widest rounded-full transition-all relative overflow-hidden",
                        downloading ? "cursor-wait opacity-80" : "hover:bg-brand-primary/10 active:scale-[0.98]"
                      )}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          İNİDİRİLİYOR %{downloadProgress}
                          <div 
                            className="absolute bottom-0 left-0 h-1 bg-brand-primary transition-all duration-300" 
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          ÇEVRİMDIŞI OKUMAK İÇİN İNDİR
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-500/10 text-green-500 border border-green-500/30 rounded-full text-[10px] font-lexend font-bold tracking-widest uppercase">
                        <Check className="w-4 h-4" />
                        İndirildi
                      </div>
                      <button
                        onClick={handleDeleteDownload}
                        className="p-4 rounded-full border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                        title="İndirmeyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
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
