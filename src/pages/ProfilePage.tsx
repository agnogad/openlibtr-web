import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Settings, Check, Book, Trash2, Download, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { AppearanceSettings } from '../types';
import { supabase } from '../lib/supabase';
import { storage } from '../services/storage';
import { offlineDB, DownloadedNovel } from '../services/db';
import { api } from '../services/api';
import { cn } from '../lib/utils';

export default function ProfilePage({ 
  session, 
  appearance, 
  setAppearance 
}: { 
  session: Session | null, 
  appearance: AppearanceSettings, 
  setAppearance: (a: AppearanceSettings) => void 
}) {
  const [downloadedNovels, setDownloadedNovels] = useState<DownloadedNovel[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ current: number, total: number, message: string } | null>(null);

  useEffect(() => {
    offlineDB.getAllNovels().then(data => {
      setDownloadedNovels(data);
      setLoadingDownloads(false);
    });
  }, []);

  const handleDelete = async (slug: string) => {
    await offlineDB.deleteNovel(slug);
    setDownloadedNovels(prev => prev.filter(n => n.slug !== slug));
  };

  const handleUpdateAll = async () => {
    if (downloadedNovels.length === 0 || isUpdatingAll) return;
    
    setIsUpdatingAll(true);
    let updatedCount = 0;
    let chaptersDownloaded = 0;

    try {
      const novels = await offlineDB.getAllNovels();
      setUpdateStatus({ current: 0, total: novels.length, message: 'Noveller kontrol ediliyor...' });

      for (let i = 0; i < novels.length; i++) {
        const stored = novels[i];
        setUpdateStatus({ current: i + 1, total: novels.length, message: `${stored.novel.title} kontrol ediliyor...` });

        try {
          const config = await api.getNovelConfig(stored.slug, true);
          const storedPaths = Object.keys(stored.chapters);
          const latestPaths = config.chapters.map(c => c.path);
          const missing = latestPaths.filter(p => !storedPaths.includes(p));

          if (missing.length > 0) {
            updatedCount++;
            setUpdateStatus({ current: i + 1, total: novels.length, message: `${stored.novel.title}: ${missing.length} yeni bölüm indiriliyor...` });

            const newChapters = { ...stored.chapters };
            for (const path of missing) {
              const content = await api.getChapterContent(stored.slug, path);
              newChapters[path] = content;
              chaptersDownloaded++;
            }

            await offlineDB.saveNovel({
              ...stored,
              config,
              chapters: newChapters,
              downloadedAt: Date.now()
            });
          }
        } catch (err) {
          console.error(`Error updating ${stored.slug}:`, err);
        }
      }

      // Refresh list
      const finalNovels = await offlineDB.getAllNovels();
      setDownloadedNovels(finalNovels);

      if (updatedCount > 0) {
        alert(`${updatedCount} novel güncellendi! Toplam ${chaptersDownloaded} yeni bölüm indirildi.`);
      } else {
        alert('Tüm noveller güncel! Yeni bölüm bulunamadı.');
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsUpdatingAll(false);
      setUpdateStatus(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const themes = [
    { name: 'Lavanta', color: '#d0bcff' },
    { name: 'Buz Mavisi', color: '#a8c7ff' },
    { name: 'Nane', color: '#b4eeb4' },
    { name: 'Gül', color: '#ffb4ab' },
    { name: 'Altın', color: '#efc06d' },
    { name: 'Beyaz', color: '#ffffff' },
  ];

  const bgThemes = [
    { id: 'material', name: 'Material Dark', color: '#1c1b1f' },
    { id: 'pitch', name: 'Zifiri', color: '#000000' },
    { id: 'deep', name: 'Derin Lacivert', color: '#050a14' },
    { id: 'forest', name: 'Yosun Yeşili', color: '#08100c' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 pb-32">
      <div className="space-y-10">
        <div className="m3-card p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-brand-primary-container flex items-center justify-center mb-6 shadow-md border-4 border-brand-surface">
            <User className="text-brand-on-primary-container w-12 h-12" />
          </div>
          <h2 className="text-3xl font-lexend font-bold text-white mb-2">{session ? 'Profil Ayarları' : 'Misafir Kullanıcı'}</h2>
          
          {session ? (
            <>
              <p className="text-brand-text-muted font-lexend text-sm mb-8 tracking-wide">{session.user.email}</p>
              <button 
                onClick={handleLogout}
                className="px-10 py-3 rounded-full border border-red-400 text-red-400 font-lexend font-bold text-sm tracking-wide hover:bg-red-400/10 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                PROFİLDEN AYRIL
              </button>
            </>
          ) : (
            <>
              <p className="text-brand-text-muted font-lexend text-sm mb-8 tracking-wide max-w-sm">Geçmişinizi ve cihazlar arası senkronizasyon özelliklerini kullanmak için giriş yapın.</p>
              <Link 
                to="/login"
                className="px-10 py-3 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                GİRİŞ YAP / KAYIT OL
              </Link>
            </>
          )}
        </div>

        {/* Primary Color Selector */}
        <div className="m3-card p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-lexend font-bold text-white">Vurgu Rengi</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <button
                key={theme.color}
                onClick={() => {
                  const newSettings = { ...appearance, primaryColor: theme.color };
                  setAppearance(newSettings);
                  storage.saveAppearanceSettings(newSettings);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all",
                  appearance.primaryColor === theme.color
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-brand-border/30 bg-brand-surface-variant/10 hover:border-brand-primary/40"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-full shadow-inner" 
                  style={{ backgroundColor: theme.color }}
                />
                <span className={cn(
                  "text-[13px] font-lexend font-medium",
                  appearance.primaryColor === theme.color ? "text-brand-primary" : "text-brand-text-muted"
                )}>{theme.name}</span>
                {appearance.primaryColor === theme.color && (
                   <motion.div layoutId="activeTheme" className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Theme Selector */}
        <div className="m3-card p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-brand-surface-variant/20 text-brand-text-main">
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
            </div>
            <h3 className="text-xl font-lexend font-bold text-white">Arka Plan Teması</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bgThemes.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  const newSettings = { ...appearance, theme: bg.id };
                  setAppearance(newSettings);
                  storage.saveAppearanceSettings(newSettings);
                }}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all text-left",
                  appearance.theme === bg.id
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-brand-border/30 bg-brand-surface-variant/10 hover:border-brand-primary/40"
                )}
              >
                <div 
                  className="w-12 h-12 rounded-2xl shadow-lg border border-white/5" 
                  style={{ backgroundColor: bg.color }}
                />
                <div className="flex-1">
                  <p className={cn(
                    "font-lexend font-bold text-sm",
                    appearance.theme === bg.id ? "text-brand-primary" : "text-white"
                  )}>{bg.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-brand-text-muted">Görünüm</p>
                </div>
                {appearance.theme === bg.id && (
                   <Check className="w-5 h-5 text-brand-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Downloads Section */}
      <div className="mt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-lexend font-bold text-white">İndirilenler</h3>
          </div>
          
          <div className="flex items-center gap-3">
            {downloadedNovels.length > 0 && (
              <button
                onClick={handleUpdateAll}
                disabled={isUpdatingAll}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-lexend font-bold text-xs uppercase tracking-widest transition-all",
                  isUpdatingAll 
                    ? "bg-brand-primary/20 text-brand-primary cursor-wait" 
                    : "bg-brand-surface-variant/20 text-white hover:bg-brand-primary hover:text-brand-bg shadow-sm"
                )}
              >
                {isUpdatingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                HEPSİNİ GÜNCELLE
              </button>
            )}
            <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-widest leading-none">
              {downloadedNovels.length} NOVEL
            </span>
          </div>
        </div>

        <AnimatePresence>
          {updateStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="m3-card p-4 bg-brand-primary/5 border-brand-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-widest">GÜNCELLEME SÜRÜYOR</span>
                  <span className="text-[10px] font-mono text-brand-primary">{updateStatus.current} / {updateStatus.total}</span>
                </div>
                <div className="h-1.5 w-full bg-brand-primary/10 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="h-full bg-brand-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(updateStatus.current / updateStatus.total) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-brand-text-muted font-lexend">{updateStatus.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loadingDownloads ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="m3-card p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : downloadedNovels.length === 0 ? (
          <div className="m3-card p-12 text-center border-dashed">
            <div className="w-16 h-16 bg-brand-surface-variant/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-8 h-8 text-brand-text-muted opacity-30" />
            </div>
            <p className="text-brand-text-muted font-lexend text-sm">Henüz çevrimdışı okumak için bir novel indirmediniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {downloadedNovels.map((download) => (
              <motion.div
                key={download.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="m3-card p-5 group flex flex-col gap-4 border-2 border-transparent hover:border-brand-primary/20"
              >
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={api.getCoverUrl(download.slug)} 
                      alt={download.novel.title} 
                      className="w-20 h-28 object-cover rounded-xl shadow-md border border-brand-border/30"
                    />
                    <div className="absolute -top-3 -right-3 bg-brand-primary text-brand-bg rounded-full p-1.5 shadow-lg border-2 border-brand-surface">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 text-[9px] font-lexend font-bold text-green-400 uppercase tracking-widest bg-green-400/10 px-2 py-1 rounded-md w-fit mb-2 border border-green-400/20">
                       <Download className="w-3 h-3" />
                       Çevrimdışı Okunabilir
                    </div>
                    <h4 className="font-lexend font-bold text-white text-base line-clamp-2 mb-1 leading-snug">{download.novel.title}</h4>
                    <p className="text-[11px] text-brand-text-muted mt-auto flex items-center gap-2">
                       <Book className="w-3.5 h-3.5" /> {download.config.total_chapters} Bölüm
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 mt-auto">
                   <Link 
                    to={`/novel/${download.slug}`}
                    className="flex-1 py-3 bg-brand-surface-variant/30 text-white text-xs font-lexend font-bold rounded-xl text-center hover:bg-brand-primary hover:text-brand-bg transition-colors border border-transparent hover:border-brand-primary"
                   >
                     KİTABA GİT
                   </Link>
                   <button
                    onClick={() => handleDelete(download.slug)}
                    className="p-3 rounded-xl border border-brand-border/30 text-brand-text-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    title="İndirmeyi Klasörden Sil"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
