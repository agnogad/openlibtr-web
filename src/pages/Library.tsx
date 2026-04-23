import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Novel, ResumeData } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';

export default function Library({ search, setSearch }: { search: string, setSearch: (s: string) => void }) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeData | null>(null);

  useEffect(() => {
    api.getLibrary().then(data => {
      setNovels(data);
      setLoading(false);
    });
    setResume(storage.getResume());
  }, []);

  const filteredNovels = novels.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Resume Section */}
      {resume && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="m3-card p-6 flex flex-col md:flex-row items-center gap-8 bg-brand-primary-container/10">
            <div className="relative w-28 h-40 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-brand-border/20">
              <img src={api.getCoverUrl(resume.slug)} alt={resume.novelTitle} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-widest mb-2 block">OKUMAYA DEVAM ET</span>
              <h3 className="text-xl sm:text-2xl font-lexend font-bold text-white mb-1 line-clamp-1 sm:line-clamp-2">{resume.novelTitle}</h3>
              <p className="text-sm text-brand-text-muted mb-6">Mevcut Bölüm: {resume.chapterId}</p>
              
              <Link 
                to={`/read/${resume.slug}/${resume.chapterId}`}
                className="inline-flex items-center gap-3 px-8 py-3 bg-brand-primary text-brand-bg font-lexend font-bold rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Dönüş Yap
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Popüler Noveller Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-lexend font-bold text-white">Popüler Noveller</h2>
          <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-wider">{novels.length} TOPLAM</span>
        </div>

        {/* Search Bar - Repositioned for all screen sizes */}
        <div className="mb-10 max-w-2xl">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-muted w-5 h-5 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="Novel kütüphanesinde keşfe çıkın..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface-variant/20 border-none rounded-2xl py-4 pl-14 pr-6 text-base text-brand-text-main placeholder:text-brand-text-muted/60 focus:ring-2 focus:ring-brand-primary/20 transition-all font-lexend"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[10/14] bg-brand-surface rounded-[28px] animate-pulse" />
                <div className="h-4 bg-brand-surface rounded-full w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredNovels.length === 0 ? (
          <div className="py-32 text-center">
            <Search className="w-16 h-16 text-brand-text-muted mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-lexend font-bold text-white mb-2">Sonuç Bulunamadı</h3>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 content-visibility-auto">
          {filteredNovels.map((novel, idx) => (
            <motion.div
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
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/20 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 delay-75">
                    <span className="px-6 py-2.5 bg-brand-primary text-brand-bg text-[12px] font-black rounded-full shadow-xl">OKUMAYA BAŞLA</span>
                  </div>
                </div>
                <h3 className="font-lexend font-bold text-base line-clamp-1 text-white group-hover:text-brand-primary transition-colors leading-tight mb-1 px-2">
                  {novel.title}
                </h3>
                <p className="text-[11px] text-brand-text-muted font-medium px-2 uppercase tracking-wide">
                  {novel.chapterCount} Bölüm
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
