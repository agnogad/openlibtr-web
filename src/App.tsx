import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Book, History, Search, ArrowLeft, ChevronRight, Bookmark, Home, User, Settings, ExternalLink, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Novel, HistoryItem, ResumeData, NovelConfig, ReadingSettings, AppearanceSettings } from './types';
import { api } from './services/api';
import { storage } from './services/storage';
import { syncService } from './services/sync';
import { cn } from './lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Components
import Giscus from './components/Giscus';

// --- Auth Component ---

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = !supabase.auth.getSession().then(({ data }) => data).catch(() => false) || (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) {
      setError('Lütfen önce Supabase URL ve Key bilgilerinizi Secrets panelinden (Ayarlar) ekleyin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Kayıt başarılı! Lütfen e-postanızı kontrol edin.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-brand-surface border border-brand-border shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </h2>
        <p className="text-brand-text-muted text-center mb-8 text-sm">
          Okuma listenizi senkronize etmek için devam edin.
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-muted mb-2">E-posta</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
              placeholder="ornek@mail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-text-muted mb-2">Şifre</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-black font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            {loading ? 'Yükleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-brand-text-muted hover:text-brand-primary transition-colors"
          >
            {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfilePage({ 
  session, 
  appearance, 
  setAppearance 
}: { 
  session: Session, 
  appearance: AppearanceSettings, 
  setAppearance: (a: AppearanceSettings) => void 
}) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const themes = [
    { name: 'Gök Mavisi', color: '#38bdf8' },
    { name: 'Zümrüt', color: '#10b981' },
    { name: 'Gül', color: '#f43f5e' },
    { name: 'Kehribar', color: '#f59e0b' },
    { name: 'Mor', color: '#a855f7' },
    { name: 'Gümüş', color: '#94a3b8' },
  ];

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-8 rounded-3xl bg-brand-surface border border-brand-border text-center">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="text-brand-primary w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profil</h2>
          <p className="text-brand-text-muted mb-8">{session.user.email}</p>
          
          <div className="space-y-4">
            <Link to="/history" className="flex items-center justify-between p-4 rounded-xl bg-brand-bg border border-brand-border hover:border-brand-primary/50 transition-all">
              <span className="text-sm font-medium">Okuma Geçmişi</span>
              <ChevronRight className="w-4 h-4 text-brand-text-muted" />
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Theme Card */}
        <div className="p-8 rounded-3xl bg-brand-surface border border-brand-border">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text-muted mb-6 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Görünüm Teması
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.color}
                onClick={() => {
                  const newSettings = { primaryColor: theme.color };
                  setAppearance(newSettings);
                  storage.saveAppearanceSettings(newSettings);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  appearance.primaryColor === theme.color
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-transparent bg-brand-bg hover:border-brand-border"
                )}
              >
                <div 
                  className="w-8 h-8 rounded-full shadow-lg" 
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-6 rounded-3xl bg-brand-surface/30 border border-brand-border text-center">
          <p className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">
            v2.3.0 Optimized &bull; AI Studio
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Menu Components ---

function BottomNav({ session }: { session: Session | null }) {
  const location = useLocation();
  const navItems = [
    { name: 'Ana Menü', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: History },
    { name: session ? 'Profil' : 'Giriş', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-surface/80 backdrop-blur-xl border-t border-brand-border flex items-center justify-around h-20 px-6 pb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            location.pathname === item.path ? "text-brand-primary scale-110" : "text-brand-text-muted"
          )}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}

function SideNav({ session }: { session: Session | null }) {
  const location = useLocation();
  const menuItems = [
    { name: 'Ana Menü', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: History },
    { name: session ? 'Profil' : 'Ayarlar', path: '/profile', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col gap-2 w-64 p-6 border-r border-brand-border h-[calc(100vh-64px)] sticky top-16">
      {menuItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
            location.pathname === item.path
              ? "bg-brand-surface text-brand-text-main shadow-sm border border-brand-border"
              : "text-brand-text-muted hover:text-brand-text-main hover:bg-brand-surface/50"
          )}
        >
          <item.icon className={cn("w-5 h-5 transition-colors", location.pathname === item.path ? "text-brand-primary" : "text-brand-text-muted group-hover:text-brand-primary")} />
          {item.name}
        </Link>
      ))}
      <div className="mt-auto p-4 rounded-xl bg-brand-surface/30 border border-brand-border">
        <p className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold mb-2">Durum</p>
        <span className="text-xs text-brand-text-muted font-medium">
          {session ? 'Giriş Yapıldı' : 'Misafir Modu'}
        </span>
      </div>
    </aside>
  );
}

function Header({ search, setSearch }: { search: string, setSearch: (s: string) => void }) {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  if (isReader) return null;

  return (
    <header className="glass-header h-16 flex items-center shrink-0">
      <div className="container mx-auto px-6 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-3 h-3 bg-brand-primary rounded-[2px] shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          <span className="text-lg font-bold tracking-tighter text-white uppercase">
            OKUTTUR
          </span>
        </Link>
        
        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text"
            placeholder="Novel ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 text-sm text-brand-text-main placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary/50 transition-all font-sans"
          />
        </div>

        <div className="hidden lg:block">
          <Link to="/profile" className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center hover:border-brand-primary transition-all">
            <User className="text-brand-text-muted w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Library({ search }: { search: string }) {
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand-primary" />
            Kaldığın Yerden Devam Et
          </h2>
          <div className="group relative bg-gradient-to-r from-brand-surface to-[#27272a] border border-brand-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Book className="w-32 h-32 text-brand-primary" strokeWidth={1} />
            </div>
            
            <div className="relative w-20 h-28 rounded-lg overflow-hidden shadow-2xl shrink-0 border border-brand-border">
              <img src={api.getCoverUrl(resume.slug)} alt={resume.novelTitle} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center sm:text-left relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-brand-text-muted mb-1">Okumaya Devam Et</h4>
              <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{resume.novelTitle}</h3>
              <div className="hidden sm:block w-full max-w-xs h-1.5 bg-white/10 rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-brand-primary w-2/3 rounded-full" />
              </div>
              <p className="text-xs text-brand-text-muted">Bölüm {resume.chapterId} / Güncel</p>
            </div>
            
            <Link 
              to={`/read/${resume.slug}/${resume.chapterId}`}
              className="relative z-10 px-8 py-3 bg-brand-primary text-black font-bold rounded-lg hover:scale-105 active:scale-95 transition-transform shrink-0"
            >
              Okumaya Başla
            </Link>
          </div>
        </motion.div>
      )}

      {/* Popüler Noveller Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <span>🔥</span> Popüler Noveller
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[2/3] bg-brand-surface rounded-xl animate-pulse" />
                <div className="h-4 bg-brand-surface rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredNovels.map((novel) => (
              <Link 
                key={novel.slug} 
                to={`/novel/${novel.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-brand-surface border border-brand-border group-hover:-translate-y-1 transition-all duration-300">
                  <img 
                    src={api.getCoverUrl(novel.slug)} 
                    alt={novel.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 text-brand-text-main group-hover:text-brand-primary transition-colors leading-snug mb-1">
                  {novel.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-brand-text-muted mt-auto uppercase tracking-tighter font-medium">
                  <span>Bölüm {novel.chapterCount}</span>
                  <span>{new Date(novel.lastUpdated).toLocaleDateString('tr-TR')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPage({ session }: { session: Session | null }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      if (session) {
        const remoteHistory = await syncService.getHistory(session.user.id);
        setHistory(remoteHistory);
      } else {
        setHistory(storage.getHistory());
      }
      setLoading(false);
    };
    loadHistory();
  }, [session]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <History className="w-6 h-6 text-brand-primary" />
          Okuma Geçmişi
        </h1>
        <button 
          onClick={() => {
            storage.clearHistory();
            setHistory([]);
          }}
          className="text-xs font-bold uppercase tracking-wider text-red-500/80 hover:text-red-500 py-2 px-3 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-all"
        >
          Tümünü Temizle
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center animate-pulse text-brand-text-muted">Geçmiş yükleniyor...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface rounded-2xl border border-brand-border">
          <History className="w-12 h-12 text-brand-text-muted mx-auto mb-4 opacity-10" />
          <p className="text-brand-text-muted">Okuma geçmişin şu an boş.</p>
          <Link to="/" className="text-brand-primary mt-4 inline-block font-medium hover:underline">Hemen bir şeyler keşfet</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, idx) => (
            <Link 
              key={`${item.slug}-${item.chapterId}-${item.timestamp}`}
              to={`/read/${item.slug}/${item.chapterId}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border hover:bg-brand-surface transition-all group"
            >
              <div className="w-12 h-16 rounded border border-brand-border overflow-hidden shrink-0">
                <img src={api.getCoverUrl(item.slug)} alt={item.novelTitle} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white group-hover:text-brand-primary transition-colors">{item.novelTitle}</h3>
                <p className="text-xs text-brand-text-muted mt-1">Bölüm {item.chapterId}</p>
              </div>
              <div className="text-right text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
                {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: tr })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NovelDetails() {
  const { slug } = useParams();
  const [config, setConfig] = useState<NovelConfig | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.getNovelConfig(slug),
      api.getLibrary().then(lib => lib.find(n => n.slug === slug))
    ]).then(([conf, nav]) => {
      setConfig(conf);
      setNovel(nav || null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="p-20 text-center animate-pulse text-brand-text-muted">İçerik hazırlanıyor...</div>;
  if (!config || !novel) return <div className="p-20 text-center text-red-500">Novel bulunamadı.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Novel Header Info */}
      <div className="w-full md:w-80 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-brand-border ring-1 ring-white/5">
            <img src={api.getCoverUrl(config.slug)} alt={novel.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{novel.title}</h1>
            <div className="flex items-center gap-3 text-brand-text-muted text-xs font-bold uppercase tracking-widest mb-6">
              <Book className="w-4 h-4 text-brand-primary" />
              {config.total_chapters} BÖLÜM
            </div>
            <Link 
              to={`/read/${config.slug}/${config.chapters[0].id}`}
              className="block w-full py-4 bg-brand-primary text-black font-bold rounded-xl text-center shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              Okumaya Başla
            </Link>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1">
        <h2 className="text-lg font-bold text-white mb-6 pb-2 border-b border-brand-border flex items-center gap-2">
          <span>📜</span> Bölüm Arşivi
        </h2>
        <div className="grid gap-2">
          {config.chapters.map((ch) => (
            <Link 
              key={ch.id}
              to={`/read/${config.slug}/${ch.id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-primary/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-[10px] font-bold text-brand-text-muted">#{ch.id}</span>
                <span className="font-semibold text-sm group-hover:text-brand-primary transition-colors">Bölüm {ch.id}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-primary transition-colors translate-x-0 group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useParams, useNavigate } from 'react-router-dom';

function Reader({ session }: { session: Session | null }) {
  const { slug, chapterId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<NovelConfig | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [readerSettings, setReaderSettings] = useState<ReadingSettings>(storage.getReadingSettings());
  const [showSettings, setShowSettings] = useState(false);

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
        <div className="relative">
          <div className="w-16 h-16 border-2 border-brand-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-brand-text-muted font-bold text-xs uppercase tracking-[3px] animate-pulse">Sayfa Yükleniyor</p>
      </div>
    </div>
  );

  if (!novel || !config) return null;

  const currentIdx = config.chapters.findIndex(c => c.id === parseInt(chapterId!));
  const prevCh = config.chapters[currentIdx - 1];
  const nextCh = config.chapters[currentIdx + 1];

  const htmlContent = DOMPurify.sanitize(marked.parse(chapter) as string);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Reader Nav */}
      <nav className="glass-header h-16 flex items-center shrink-0">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/novel/${slug}`)}
            className="flex items-center gap-2 text-brand-text-muted hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Geri Dön</span>
          </button>
          
          <div className="flex flex-col items-center max-w-[60%]">
            <h2 className="text-sm font-bold text-white truncate w-full text-center tracking-tight">{novel.title}</h2>
            <span className="text-[10px] text-brand-primary font-black uppercase tracking-[3px]">BÖLÜM {chapterId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showSettings ? "bg-brand-primary text-black" : "text-brand-text-muted hover:text-white"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-0 right-0 z-40 bg-brand-surface border-b border-brand-border p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="container mx-auto max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3 block">Yazı Boyutu ({readerSettings.fontSize}px)</label>
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
                    className="w-full accent-brand-primary cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-3 block">Yazı Tipi</label>
                  <div className="flex gap-2">
                    {(['Lexend', 'Inter', 'Serif', 'Mono'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => {
                          const newSettings = { ...readerSettings, fontFamily: font };
                          setReaderSettings(newSettings);
                          storage.saveReadingSettings(newSettings);
                        }}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all",
                          readerSettings.fontFamily === font
                            ? "bg-brand-primary text-black border-brand-primary"
                            : "bg-brand-bg text-brand-text-muted border-brand-border hover:border-brand-text-muted"
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

      <main className="flex-1 container mx-auto px-6 py-12 max-w-2xl selection:bg-brand-primary/30">
        <article 
          className={cn(
            "markdown-body transition-all",
            readerSettings.fontFamily === 'Lexend' && "font-sans",
            readerSettings.fontFamily === 'Inter' && "font-inter",
            readerSettings.fontFamily === 'Serif' && "font-serif",
            readerSettings.fontFamily === 'Mono' && "font-mono"
          )}
          style={{ fontSize: `${readerSettings.fontSize}px`, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
        
        {/* Navigation */}
        <div className="mt-20 flex items-stretch gap-4">
          {prevCh ? (
            <Link 
              to={`/read/${slug}/${prevCh.id}`}
              className="flex-1 p-5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-primary/40 transition-all group flex flex-col items-center justify-center"
            >
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Önceki</span>
              <span className="font-bold text-white group-hover:text-brand-primary transition-colors">Bölüm {prevCh.id}</span>
            </Link>
          ) : <div className="flex-1" />}

          {nextCh ? (
            <Link 
              to={`/read/${slug}/${nextCh.id}`}
              className="flex-[2] p-5 rounded-xl bg-brand-primary text-black font-black text-center transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] flex flex-col items-center justify-center"
            >
              <span className="text-[10px] opacity-70 uppercase tracking-widest mb-1">Sonraki Bölüm</span>
              <span className="text-lg">Bölüm {nextCh.id}</span>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        {/* Comments */}
        <div className="mt-24 pt-12 border-t border-brand-border">
          <h3 className="text-xl font-bold text-white mb-2">Tartışma</h3>
          <p className="text-xs text-brand-text-muted mb-10 font-medium">Bu bölüm hakkında ne düşünüyorsun?</p>
          <Giscus slug={slug!} chapterId={parseInt(chapterId!)} />
        </div>
      </main>
      
      <footer className="py-12 border-t border-brand-border bg-brand-surface/20 text-center">
        <p className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">
          &copy; 2026 OKUTTUR &bull; Dark Reader Experience
        </p>
      </footer>
    </div>
  );
}

// --- App Root ---

export default function App() {
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appearance, setAppearance] = useState<AppearanceSettings>(storage.getAppearanceSettings());

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', appearance.primaryColor);
  }, [appearance]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text-main selection:bg-brand-primary/30 pb-20 lg:pb-0">
        <Header search={search} setSearch={setSearch} />
        
        <div className="flex-1 flex container mx-auto">
          <SideNav session={session} />
          
          <main className={cn("flex-1 p-6 md:p-10 overflow-hidden")}>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Library search={search} />} />
                <Route path="/novel/:slug" element={<NovelDetails />} />
                <Route path="/read/:slug/:chapterId" element={<Reader session={session} />} />
                <Route path="/login" element={session ? <Navigate to="/profile" /> : <AuthPage />} />
                
                {/* Protected Routes */}
                <Route path="/history" element={session ? <HistoryPage session={session} /> : <Navigate to="/login" />} />
                <Route path="/profile" element={session ? <ProfilePage session={session} appearance={appearance} setAppearance={setAppearance} /> : <Navigate to="/login" />} />

                {/* Redirect any other path to home */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>

        <BottomNav session={session} />

        <footer className={cn("py-12 border-t border-brand-border text-center hidden lg:block", !session && "block")}>
          <p className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">
            &copy; 2026 OKUTTUR &bull; Developed by AI
          </p>
        </footer>
      </div>
    </Router>
  );
}

