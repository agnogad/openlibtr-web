import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, ChevronLeft, ChevronRight, Book, Download } from 'lucide-react';
import {  m  } from 'motion/react';
import { Novel, ResumeData } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { offlineDB } from '../services/db';

export default function Library({ search, setSearch }: { search: string, setSearch: (s: string) => void }) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [downloadedSlugs, setDownloadedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [today] = useState(() => new Date());
  const pageSize = 20;

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const offlineData = await offlineDB.getAllNovels();
        setDownloadedSlugs(offlineData.map(n => n.slug));

        try {
          const data = await api.getLibrary();
          // Sort by lastUpdated, newest first
          const sortedNovels = data.toSorted((a, b) => {
            const dateA = new Date(a.lastUpdated).getTime();
            const dateB = new Date(b.lastUpdated).getTime();
            return dateB - dateA;
          });
          setNovels(sortedNovels);
        } catch (apiError) {
          console.warn("API fetch failed, falling back to offline library", apiError);
          // Show only downloaded novels if offline
          setNovels(offlineData.map(d => d.novel));
        }
      } catch (error) {
        console.error("Library load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
    setResume(storage.getResume());
    setBookmarks(storage.getBookmarks());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredNovels = novels.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNovels.length / pageSize);
  const paginatedNovels = filteredNovels.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-12">
      {/* Search & Hero Context */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 pt-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-lexend font-extrabold text-white mb-4 tracking-[-0.02em] leading-tight">
            Sonsuz dünyalara<br className="hidden md:block" /> adım atın.
          </h1>
          <p className="text-lg text-brand-text-muted max-w-lg font-lexend leading-relaxed mb-8">
            Binlerce Türkçe light novel ve web novel. Tamamen ücretsiz, açık kaynaklı ve reklamsız okuma deneyimi.
          </p>
          
          <div className="relative group max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted size-5 group-focus-within:text-brand-primary transition-colors duration-300" />
            <input 
              id="search-input"
              type="text"
              placeholder="Novel kütüphanesinde keşfe çıkın..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface-variant/30 border border-brand-border/20 rounded-full py-4 pl-16 pr-6 text-base text-brand-text-main placeholder:text-brand-text-muted/60 focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/40 focus:bg-brand-surface transition-all font-lexend shadow-inner"
            />
          </div>
        </div>

        {/* Dynamic Resume Card */}
        {resume && (
          <m.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-auto shrink-0"
          >
            <div className="relative group overflow-hidden rounded-[32px] bg-brand-surface border border-brand-border/20 p-2 shadow-2xl flex items-center gap-4 hover:border-brand-primary/30 transition-colors w-full sm:w-[380px]">
              <div className="relative w-24 h-32 rounded-[24px] overflow-hidden shrink-0 shadow-md">
                <img src={api.getCoverUrl(resume.slug)} alt={resume.novelTitle} className="size-full object-cover transform group-hover:scale-105 transition-transform duration-500" fetchPriority="high" decoding="async" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="flex-1 pr-4 py-2">
                <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-widest mb-1.5 block">OKUMAYA DEVAM ET</span>
                <h3 className="text-base font-lexend font-semibold text-white mb-1 line-clamp-2 leading-snug">{resume.novelTitle}</h3>
                <p className="text-xs text-brand-text-muted mb-4 font-medium">Bölüm {resume.chapterId}</p>
                <Link 
                  to={`/read/${resume.slug}/${resume.chapterId}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black font-lexend font-bold text-xs rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all w-full"
                >
                  <Play className="size-3.5 fill-current" />
                  Kaldığın Yerden Dön
                </Link>
              </div>
            </div>
          </m.div>
        )}
      </div>

      {/* Favoriler Horizontal List */}
      {bookmarks.length > 0 && (
        <div className="mb-2">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl font-lexend font-semibold text-white tracking-tight">Favorileriniz</h2>
            <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-widest">{bookmarks.length} NOVEL</span>
          </div>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
            {bookmarks.map((bookmark, idx) => (
              <m.div
                key={bookmark.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="snap-start shrink-0 w-36 sm:w-44"
              >
                <Link 
                  to={`/novel/${bookmark.slug}`}
                  className="group flex flex-col"
                >
                  <div className="m3-card aspect-[10/14] mb-3 overflow-hidden group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-brand-primary/10 transition-all duration-300 rounded-[24px]">
                    <img 
                      src={api.getCoverUrl(bookmark.slug)} 
                      alt={bookmark.title} 
                      className="size-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-lexend font-semibold text-sm line-clamp-2 text-white group-hover:text-brand-primary transition-colors leading-snug px-1">
                    {bookmark.title}
                  </h3>
                </Link>
              </m.div>
            ))}
          </div>
        </div>
      )}

      {/* Son Güncellemeler Grid */}
      <div>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl lg:text-3xl font-lexend font-semibold text-white tracking-tight">Son Güncellemeler</h2>
          <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-widest">{novels.length} TOPLAM</span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-4">
                <div className="aspect-[10/14] bg-brand-surface rounded-[28px] animate-pulse" />
                <div className="h-4 bg-brand-surface rounded-full w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredNovels.length === 0 ? (
          <div className="py-32 text-center">
            <Search className="size-16 text-brand-text-muted mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-lexend font-semibold text-white mb-2">Sonuç Bulunamadı</h3>
            <p className="text-brand-text-muted font-lexend text-sm max-w-xs mx-auto">
              "{search}" ile eşleşen bir novel bulamadık. Başka bir anahtar kelime deneyebilirsiniz.
            </p>
            <button 
              onClick={() => setSearch('')}
              className="mt-8 px-8 py-2 rounded-full border border-brand-primary text-brand-primary text-sm font-bold hover:bg-brand-primary/10 transition-all font-lexend"
            >
              Aramayı Sıfırla
            </button>
          </div>
        ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 content-visibility-auto">
            {paginatedNovels.map((novel, idx) => {
              const ts = novel.lastUpdated;
              const updateDate = new Date(ts);
              const isToday = updateDate.getDate() === today.getDate() &&
                             updateDate.getMonth() === today.getMonth() &&
                             updateDate.getFullYear() === today.getFullYear();

              return (
              <m.div
                key={novel.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Link 
                  to={`/novel/${novel.slug}`}
                  className="group flex flex-col"
                >
                  <div className="m3-card aspect-[10/14] mb-4 overflow-hidden group-hover:-translate-y-2 group-hover:rotate-1 transition-all duration-500 ease-out">
                    <img 
                      src={api.getCoverUrl(novel.slug)} 
                      alt={novel.title} 
                      className="size-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/20 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 delay-75">
                      <span className="px-6 py-2.5 bg-brand-primary text-brand-bg text-[12px] font-black rounded-full shadow-xl">OKUMAYA BAŞLA</span>
                    </div>
                  </div>
                  <h3 className="font-lexend font-semibold text-base line-clamp-1 text-white group-hover:text-brand-primary transition-colors leading-tight mb-1 px-2">
                    {novel.title}
                  </h3>
                  <p suppressHydrationWarning className="text-[11px] text-brand-text-muted font-medium px-2 uppercase tracking-wide flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {novel.chapterCount} Bölüm
                      {downloadedSlugs.includes(novel.slug) && (
                        <Download className="size-2.5 text-green-400" />
                      )}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary text-[9px] font-bold rounded ring-1 ring-brand-primary/30">
                        GÜNCELLENDİ
                      </span>
                    )}
                  </p>
                </Link>
              </m.div>
            )})}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-12 py-10 border-t border-brand-border/10">
              <button 
                disabled={page === 1}
                onClick={() => {
                  setPage(p => p - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 transition-all"
              >
                <ChevronLeft className="size-6" />
              </button>
              <span className="text-sm font-lexend font-bold text-brand-text-muted uppercase tracking-widest leading-none">SAYFA {page} / {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => {
                  setPage(p => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 rounded-2xl bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary/20 transition-all"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
