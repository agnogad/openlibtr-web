import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Settings, Check, Book, Trash2, Download, RefreshCw, Loader2, Github } from 'lucide-react';
import {  m, AnimatePresence  } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { AppearanceSettings } from '../types';
import { supabase } from '../lib/supabase';
import { storage } from '../services/storage';
import { offlineDB, DownloadedNovel } from '../services/db';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export default function ProfilePage({ 
  session, 
  appearance, 
  setAppearance 
}: { 
  session: Session | null, 
  appearance: AppearanceSettings, 
    setAppearance: (a: AppearanceSettings) => void 
}) {
  const [githubProxy, setGithubProxy] = useState(() => storage.getGithubProxy());
  const [pluginsState, setPluginsState] = useState<{
    downloadedNovels: DownloadedNovel[];
    loadingDownloads: boolean;
    isUpdatingAll: boolean;
    updateStatus: { current: number, total: number, message: string } | null;
    slugToDelete: string | null;
  }>({
    downloadedNovels: [],
    loadingDownloads: true,
    isUpdatingAll: false,
    updateStatus: null,
    slugToDelete: null,
  });
  
  const { downloadedNovels, loadingDownloads, isUpdatingAll, updateStatus, slugToDelete } = pluginsState;

  useEffect(() => {
    offlineDB.getAllNovels().then(data => {
      setPluginsState(prev => ({ ...prev, downloadedNovels: data, loadingDownloads: false }));
    });
  }, []);

  const handleDelete = async (slug: string) => {
    await offlineDB.deleteNovel(slug);
    setPluginsState(prev => ({ ...prev, downloadedNovels: prev.downloadedNovels.filter(n => n.slug !== slug), slugToDelete: null }));
  };

  const handleUpdateAll = async () => {
    if (downloadedNovels.length === 0 || isUpdatingAll) return;
    
    setPluginsState(prev => ({ ...prev, isUpdatingAll: true }));
    let updatedCount = 0;
    let chaptersDownloaded = 0;

    try {
      const novels = await offlineDB.getAllNovels();
      setPluginsState(prev => ({ ...prev, updateStatus: { current: 0, total: novels.length, message: 'Noveller kontrol ediliyor...' } }));

      // Run multiple outer loop iterations concurrently if possible, but keeping it simple for now and just addressing inner loop
      // to resolve await-in-loop warning. Note: react-doctor prefers not to have sequential await in loop. Let's make an array of promises.
      const syncTasks = novels.map(async (stored, i) => {
        try {
          const config = await api.getNovelConfig(stored.slug, true);
          const storedPaths = new Set(Object.keys(stored.chapters));
          const latestPaths = config.chapters.map(c => c.path);
          const missing = latestPaths.filter(p => !storedPaths.has(p));

          if (missing.length > 0) {
            const newChapters = { ...stored.chapters };
            const downloads = missing.map(async path => {
               const content = await api.getChapterContent(stored.slug, path);
               return { path, content };
            });
            const results = await Promise.all(downloads);
            for (const { path, content } of results) {
               newChapters[path] = content;
            }

            await offlineDB.saveNovel({
              ...stored,
              config,
              chapters: newChapters,
              downloadedAt: Date.now()
            });
            return { updated: true, newChaptersCount: missing.length, title: stored.novel.title };
          }
        } catch (err) {
          console.error(`Error updating ${stored.slug}:`, err);
        }
        return { updated: false, newChaptersCount: 0, title: stored.novel.title };
      });
      
      const results = await Promise.all(syncTasks);
      
      for (const res of results) {
        if (res.updated) {
          updatedCount++;
          chaptersDownloaded += res.newChaptersCount;
        }
      }

      // Refresh list
      const finalNovels = await offlineDB.getAllNovels();
      setPluginsState(prev => ({ ...prev, downloadedNovels: finalNovels }));

      if (updatedCount > 0) {
        alert(`${updatedCount} novel güncellendi! Toplam ${chaptersDownloaded} yeni bölüm indirildi.`);
      } else {
        alert('Tüm noveller güncel! Yeni bölüm bulunamadı.');
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setPluginsState(prev => ({ ...prev, isUpdatingAll: false, updateStatus: null }));
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
      <ConfirmModal
        isOpen={!!slugToDelete}
        onClose={() => setPluginsState(prev => ({ ...prev, slugToDelete: null }))}
        onConfirm={() => slugToDelete && handleDelete(slugToDelete)}
        title="İndirmeyi Sil"
        message={`"${downloadedNovels.find(n => n.slug === slugToDelete)?.novel.title}" çevrimdışı arşivden silinecek. Bölümleri tekrar okumak için internet bağlantısı gerekecek.`}
        confirmText="İndirmeyi Sil"
      />

      <div className="space-y-10">
        <div className="m3-card p-10 flex flex-col items-center text-center">
          <div className="size-24 rounded-full bg-brand-primary-container flex items-center justify-center mb-6 shadow-md border-4 border-brand-surface">
            <User className="text-brand-on-primary-container size-12" />
          </div>
          <h2 className="text-3xl font-lexend font-semibold text-white mb-2">{session ? 'Profil Ayarları' : 'Misafir Kullanıcı'}</h2>
          
          {session ? (
            <>
              <p className="text-brand-text-muted font-lexend text-sm mb-8 tracking-wide">{session.user.email}</p>
              <button 
                onClick={handleLogout}
                className="px-10 py-3 rounded-full border border-red-400 text-red-400 font-lexend font-bold text-sm tracking-wide hover:bg-red-400/10 transition-all flex items-center gap-2"
              >
                <LogOut className="size-4" />
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

        {/* Quick Appearance Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Color Selector */}
          <div className="m3-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Settings className="size-5" />
              </div>
              <h3 className="text-base font-lexend font-semibold text-white">Vurgu Rengi</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.color}
                  onClick={() => {
                    const newSettings = { ...appearance, primaryColor: theme.color };
                    setAppearance(newSettings);
                    storage.saveAppearanceSettings(newSettings);
                  }}
                  className={cn(
                    "relative size-10 rounded-full border-2 transition-all flex items-center justify-center",
                    appearance.primaryColor === theme.color
                      ? "border-brand-primary scale-110 shadow-lg shadow-brand-primary/20"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  {appearance.primaryColor === theme.color && (
                    <Check className="size-5 text-brand-bg mix-blend-difference" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Theme Selector */}
          <div className="m3-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 rounded-lg bg-brand-surface-variant/20 text-brand-text-main">
                <div className="size-5 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
              </div>
              <h3 className="text-base font-lexend font-semibold text-white">Koyu Tema</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {bgThemes.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    const newSettings = { ...appearance, theme: bg.id };
                    setAppearance(newSettings);
                    storage.saveAppearanceSettings(newSettings);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left",
                    appearance.theme === bg.id
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-brand-border/30 bg-brand-surface-variant/10 hover:border-brand-primary/40"
                  )}
                >
                  <div 
                    className="size-6 rounded-lg shrink-0 border border-white/5" 
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className={cn(
                    "text-[11px] font-lexend font-bold truncate",
                    appearance.theme === bg.id ? "text-brand-primary" : "text-white"
                  )}>{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="m3-card p-6 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-brand-surface-variant/20 text-brand-text-main">
              <Github className="size-5" />
            </div>
            <h3 className="text-base font-lexend font-semibold text-white">GitHub Proxy (jsDelivr CDN)</h3>
          </div>
          <p className="text-sm text-brand-text-muted mb-4">
            Eğer serileri yüklerken veya bölüm listesinde sorun yaşıyorsanız, GitHub bağlantısı yerine jsDelivr CDN üzerinden çekilmesini sağlayabilirsiniz. Özellikle Türkiye'den bağlanan bazı kullanıcıların yaşadığı yüklenme sorununu çözer. Seçim yapıldığında uygulama yenilenecektir.
          </p>
          <button
            onClick={() => {
              const newVal = !githubProxy;
              setGithubProxy(newVal);
              storage.setGithubProxy(newVal);
              window.location.reload();
            }}
            className={cn(
              "flex items-center justify-between w-full p-4 rounded-xl border transition-all",
              githubProxy
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-brand-border/30 bg-brand-surface-variant/5 text-brand-text-muted hover:border-brand-primary/40"
            )}
          >
            <span className="font-lexend font-medium text-sm">
              {githubProxy ? 'Proxy Aktif' : 'Proxy Kapalı'}
            </span>
            <div className={cn(
              "w-12 h-6 rounded-full p-1 transition-colors relative",
              githubProxy ? "bg-brand-primary" : "bg-brand-border"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full bg-white transition-transform",
                githubProxy ? "translate-x-6" : "translate-x-0"
              )} />
            </div>
          </button>
        </div>
      </div>

      {/* Downloads Section */}
      <div className="mt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Download className="size-6" />
            </div>
            <h3 className="text-2xl font-lexend font-semibold text-white">İndirilenler</h3>
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
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
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
            <m.div
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
                  <m.div 
                    className="h-full bg-brand-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(updateStatus.current / updateStatus.total) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-brand-text-muted font-lexend">{updateStatus.message}</p>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {loadingDownloads ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={`skeleton-${i}`} className="m3-card p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : downloadedNovels.length === 0 ? (
          <div className="m3-card p-12 text-center border-dashed border-2 border-brand-border/30 bg-transparent flex flex-col items-center justify-center">
            <div className="size-20 bg-brand-surface-variant/30 rounded-full flex items-center justify-center mb-6 ring-4 ring-brand-surface/50">
              <Download className="size-10 text-brand-text-muted opacity-40" />
            </div>
            <h4 className="text-xl font-lexend font-semibold text-white mb-2">Çevrimdışı Novel Yok</h4>
            <p className="text-brand-text-muted font-lexend text-sm max-w-sm">Henüz çevrimdışı okumak için bir novel indirmediniz. Kütüphaneden novel indirebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloadedNovels.map((download) => (
              <m.div
                key={download.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group overflow-hidden rounded-[24px] bg-brand-surface border border-brand-border/20 shadow-md flex"
              >
                {/* Immersive Cover Background */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none blur-xl scale-110">
                  <img src={api.getCoverUrl(download.slug)} alt="" className="size-full object-cover" />
                </div>
                
                <div className="relative z-10 flex w-full p-3 gap-4">
                  <Link to={`/novel/${download.slug}`} className="relative shrink-0 block">
                    <img 
                      src={api.getCoverUrl(download.slug)} 
                      alt={download.novel.title} 
                      className="w-24 aspect-[10/14] object-cover rounded-[16px] shadow-xl group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-brand-bg rounded-full p-1.5 shadow-lg border-2 border-brand-surface z-20">
                      <Check className="size-3" strokeWidth={3} />
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0 flex flex-col pt-1 pb-2">
                    <div className="inline-flex items-center gap-1.5 text-[9px] font-lexend font-bold text-green-400 uppercase tracking-widest bg-green-400/10 px-2 py-1 rounded-md w-fit mb-2 border border-green-400/20 backdrop-blur-md">
                       <Download className="size-3" />
                       İndirildi
                    </div>
                    <Link to={`/novel/${download.slug}`} className="group-hover:text-brand-primary transition-colors">
                      <h4 className="font-lexend font-semibold text-white text-base line-clamp-2 leading-snug">{download.novel.title}</h4>
                    </Link>
                    
                    <div className="mt-auto">
                      <p className="text-[11px] text-brand-text-muted flex items-center gap-2 mb-3">
                         <Book className="size-3.5" /> {download.config.total_chapters} Bölüm Okumaya Hazır
                      </p>
                      <div className="flex items-center gap-2">
                         <Link 
                          to={`/novel/${download.slug}`}
                          className="flex-1 py-2.5 bg-brand-primary/10 text-brand-primary text-xs font-lexend font-bold rounded-xl text-center hover:bg-brand-primary hover:text-brand-bg transition-colors"
                         >
                           OKU
                         </Link>
                         <button
                          onClick={() => setPluginsState(prev => ({ ...prev, slugToDelete: download.slug }))}
                          className="p-2.5 rounded-xl border border-transparent text-brand-text-muted hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all bg-brand-surface-variant/30"
                          title="Sil"
                         >
                           <Trash2 className="size-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
