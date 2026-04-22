import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Book, History as HistoryIcon, Search, ArrowLeft, ArrowUp, ChevronRight, ChevronLeft, Bookmark, Home, User, Settings, ExternalLink, LogOut, LogIn, Menu, X, Check, Play, Clock, MessageSquare, List } from 'lucide-react';
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

// --- Constants ---

const THEME_CONFIGS = {
  material: {
    bg: '#1c1b1f',
    surface: '#25232a',
    surfaceVariant: '#49454f',
    card: '#2b2930',
    border: '#49454f',
    primaryContainer: '#4f378b',
    onPrimaryContainer: '#eaddff'
  },
  pitch: {
    bg: '#000000',
    surface: '#0a0a0a',
    surfaceVariant: '#2a2a2a',
    card: '#141414',
    border: '#333333',
    primaryContainer: '#333333',
    onPrimaryContainer: '#ffffff'
  },
  deep: {
    bg: '#050a14',
    surface: '#0a1221',
    surfaceVariant: '#1e293b',
    card: '#0f172a',
    border: '#1e293b',
    primaryContainer: '#1e3a8a',
    onPrimaryContainer: '#dbeafe'
  },
  forest: {
    bg: '#08100c',
    surface: '#0d1a14',
    surfaceVariant: '#2a3a30',
    card: '#11221a',
    border: '#2a3a30',
    primaryContainer: '#14532d',
    onPrimaryContainer: '#dcfce7'
  }
};

// --- Helpers ---

const calculateReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return { time, words };
};

// --- Auth Component ---

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md m3-card p-8 sm:p-12"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-lexend font-bold text-white mb-2">
            {isSignUp ? 'Aramıza Katıl' : 'Hoş Geldiniz'}
          </h2>
          <p className="text-brand-text-muted text-sm font-lexend">
            {isSignUp ? 'Yeni bir okuma deneyimi sizi bekliyor' : 'Kaldığınız yerden devam etmek için giriş yapın'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-surface-variant/20 border-b-2 border-brand-border/30 rounded-t-[12px] px-4 py-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-all placeholder:text-brand-text-muted/50"
              placeholder="E-posta Adresi"
            />
          </div>
          <div className="space-y-2">
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-surface-variant/20 border-b-2 border-brand-border/30 rounded-t-[12px] px-4 py-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-all placeholder:text-brand-text-muted/50"
              placeholder="Şifre"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-400/10 py-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-brand-bg font-lexend font-bold rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'İşlem Yapılıyor...' : (isSignUp ? 'Hesap Oluştur' : 'Giriş Yap')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-lexend font-medium text-brand-primary hover:underline underline-offset-4 decoration-2"
          >
            {isSignUp ? 'Hesabınız var mı? Giriş Yapın' : 'Henüz üye değil misiniz? Kayıt Olun'}
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
          <h2 className="text-3xl font-lexend font-bold text-white mb-2">Profil Ayarları</h2>
          <p className="text-brand-text-muted font-lexend text-sm mb-8 tracking-wide">{session.user.email}</p>
          
          <button 
            onClick={handleLogout}
            className="px-10 py-3 rounded-full border border-red-400 text-red-400 font-lexend font-bold text-sm tracking-wide hover:bg-red-400/10 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            PROFİLDEN AYRIL
          </button>
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
    </div>
  );
}

// --- Menu Components ---

function BottomNav({ session }: { session: Session | null }) {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  if (isReader) return null;

  const navItems = [
    { name: 'Ana Sayfa', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: HistoryIcon },
    { name: session ? 'Profil' : 'Giriş', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-brand-surface border-t border-brand-border/30 h-20 md:hidden flex items-center justify-around px-2 shadow-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
          >
            <div className={cn(
              "relative px-5 py-1 rounded-full transition-all duration-300",
              isActive ? "bg-brand-primary/20 text-brand-primary" : "text-brand-text-muted hover:bg-brand-surface-variant/30"
            )}>
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[12px] font-lexend font-medium transition-colors",
              isActive ? "text-brand-text-main" : "text-brand-text-muted"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SideNav({ 
  session, 
  isCollapsed, 
  setIsCollapsed 
}: { 
  session: Session | null, 
  isCollapsed: boolean, 
  setIsCollapsed: (c: boolean) => void 
}) {
  const location = useLocation();
  const menuItems = [
    { name: 'Ana Sayfa', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: HistoryIcon },
    { name: session ? 'Profil' : 'Giriş', path: '/profile', icon: User },
  ];

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col gap-4 p-4 h-screen sticky top-0 overflow-y-auto transition-all duration-300 border-r border-brand-border/10 bg-brand-bg/50 backdrop-blur-xl",
        isCollapsed ? "w-24" : "w-72"
      )}
    >
      <div className={cn("mt-4 mb-8 flex items-center h-10", isCollapsed ? "justify-center" : "px-4 justify-between")}>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <Link to="/" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary rounded-[12px] flex items-center justify-center shadow-lg shrink-0">
                  <Book className="w-5 h-5 text-brand-bg" />
                </div>
                <span className="text-xl font-lexend font-bold text-white tracking-tight whitespace-nowrap">OKUTTUR</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isCollapsed && (
          <Link to="/" className="w-9 h-9 bg-brand-primary rounded-[12px] flex items-center justify-center shadow-lg shrink-0">
            <Book className="w-5 h-5 text-brand-bg" />
          </Link>
        )}

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-2 rounded-full hover:bg-brand-surface-variant/20 transition-all",
            isCollapsed && "mt-4"
          )}
        >
          <Menu className="w-5 h-5 text-brand-text-muted" />
        </button>
      </div>

      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-full text-[15px] font-lexend font-medium transition-all group relative",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary shadow-sm"
                  : "text-brand-text-muted hover:bg-brand-surface-variant/20 hover:text-brand-text-main",
                isCollapsed && "justify-center px-0 w-12 mx-auto"
              )}
            >
               {isCollapsed && isActive && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md"
                />
              )}
              <item.icon className="relative z-10 w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-brand-surface border border-brand-border/30 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className={cn("mt-auto py-6 border-t border-brand-border/20", isCollapsed ? "px-0" : "px-4")}>
        <div className={cn("flex items-center gap-4", isCollapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-brand-surface-variant flex items-center justify-center shrink-0 border border-brand-border/30">
            <User className="w-5 h-5 text-brand-text-main" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-lexend font-medium text-white truncate">
                {session ? session.user.email : 'Misafir Kullanıcı'}
              </span>
              <span className="text-[11px] font-lexend text-brand-text-muted uppercase tracking-widest leading-none">
                {session ? 'Oturum Açık' : 'Oturum Açın'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function Header({ search, setSearch }: { search: string, setSearch: (s: string) => void }) {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  if (isReader) return null;

  return (
    <header className="glass-header h-16 md:h-0 sticky md:static flex items-center shrink-0 overflow-hidden px-4 md:px-0">
      <div className="w-full flex items-center justify-between md:hidden py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-[8px] flex items-center justify-center">
            <Book className="w-4 h-4 text-brand-bg" />
          </div>
          <span className="text-xl font-lexend font-bold text-white tracking-tighter">OKUTTUR</span>
        </Link>
        <Link to="/profile" className="p-2 rounded-full hover:bg-brand-surface-variant/30 transition-colors">
          <User className="text-brand-text-main w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}

function Library({ search, setSearch }: { search: string, setSearch: (s: string) => void }) {
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
              <img src={api.getCoverUrl(resume.slug)} alt={resume.novelTitle} className="w-full h-full object-cover" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
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
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary-container/20 rounded-2xl text-brand-primary">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-lexend font-bold text-white">Geçmiş</h2>
            <p className="text-sm font-lexend text-brand-text-muted">Okuduğunuz son bölümler</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            storage.clearHistory();
            setHistory([]);
          }}
          className="px-6 py-2 rounded-full text-sm font-lexend font-bold text-red-400 hover:bg-red-400/10 transition-all border border-red-400/20"
        >
          Temizle
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="m3-card h-28 animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-40">
          <HistoryIcon className="w-20 h-20 text-brand-text-muted mx-auto mb-8 opacity-20" />
          <h3 className="text-2xl font-lexend font-bold text-white mb-2">Listeniz Boş</h3>
          <p className="text-brand-text-muted font-lexend mb-10">Henüz bir novel okumaya başlamadınız.</p>
          <Link to="/" className="px-12 py-4 bg-brand-primary text-brand-bg font-lexend font-bold rounded-full shadow-lg">Gidip Keşfet</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item, idx) => (
            <motion.div
              key={`${item.slug}-${item.chapterId}-${item.timestamp}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link 
                to={`/read/${item.slug}/${item.chapterId}`}
                className="m3-card p-4 sm:p-6 flex items-center gap-6 group"
              >
                <div className="w-16 h-20 sm:w-20 sm:h-28 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-brand-border/20">
                  <img src={api.getCoverUrl(item.slug)} alt={item.novelTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-lexend font-bold text-brand-primary uppercase tracking-widest mb-1 block">BÖLÜM {item.chapterId}</span>
                  <h3 className="text-lg sm:text-xl font-lexend font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight mb-2">
                    {item.novelTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-brand-text-muted text-xs font-lexend">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: tr })}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-surface-variant/20 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-brand-bg transition-all shrink-0">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Link>
            </motion.div>
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const pageSize = 48;

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.getNovelConfig(slug),
      api.getLibrary().then(lib => lib.find(n => n.slug === slug))
    ]).then(([conf, nav]) => {
      setConfig(conf);
      setNovel(nav || null);
      setHistory(storage.getHistory());
      setResume(storage.getResume());
      setLoading(false);
    });
  }, [slug]);

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
            <img src={api.getCoverUrl(config.slug)} alt={novel.title} className="w-full h-full object-cover" />
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
                  to={`/read/${config.slug}/${config.chapters[0].id}`}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-brand-primary text-brand-bg font-lexend font-bold text-sm tracking-wide rounded-full shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Okumaya Başla
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="flex-1 min-w-0">
        <div className="m3-card p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-lexend font-bold text-white mb-1">Bölümler</h2>
              <p className="text-sm text-brand-text-muted font-lexend tracking-wide">Okumak istediğiniz bölümü seçin</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4" />
              <input 
                type="text"
                placeholder="Bölüm ara..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-brand-surface-variant/20 border-none rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder:text-brand-text-muted focus:ring-1 focus:ring-brand-primary/20 transition-all font-lexend"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {paginatedChapters.map((ch, idx) => {
              const isRead = readChapters.has(ch.id);
              const isResume = currentResume?.chapterId === ch.id;
              
              return (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.01 }}
                >
                  <Link
                    to={`/read/${slug}/${ch.id}`}
                    className={cn(
                      "flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all text-sm font-lexend font-bold relative overflow-hidden group",
                      isResume 
                        ? "bg-brand-primary text-brand-bg border-brand-primary shadow-md" 
                        : isRead 
                          ? "bg-brand-primary/5 text-brand-primary border-brand-primary/30" 
                          : "bg-brand-surface-variant/10 text-brand-text-muted border-brand-border/40 hover:border-brand-primary/40 hover:text-white"
                    )}
                  >
                    {ch.id}
                    {isRead && !isResume && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 pt-10 border-t border-brand-border/10">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-3 rounded-full bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary hover:text-brand-bg transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="px-6 py-2 rounded-full bg-brand-surface-variant/10 border border-brand-border/30 text-sm font-lexend font-bold text-white">
                {page} / {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-3 rounded-full bg-brand-surface-variant/20 text-white disabled:opacity-20 hover:bg-brand-primary hover:text-brand-bg transition-all"
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
import { useParams, useNavigate } from 'react-router-dom';

function Reader({ session }: { session: Session | null }) {
  const { slug, chapterId } = useParams();
  const [config, setConfig] = useState<NovelConfig | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState('');
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
        
        {/* Navigation - Material Style Buttons */}
        <div className="mt-20 flex flex-col sm:flex-row gap-4">
          {prevCh ? (
            <Link 
              to={`/read/${slug}/${prevCh.id}`}
              className="flex-1 p-6 rounded-[28px] bg-brand-surface-variant/10 border border-brand-border/30 hover:border-brand-primary/40 transition-all flex flex-col items-center justify-center gap-1 order-2 sm:order-1"
            >
              <span className="text-[11px] font-lexend font-bold text-brand-text-muted uppercase tracking-wider">ÖNCEKİ BÖLÜM</span>
              <span className="font-lexend font-bold text-white text-lg">Bölüm {prevCh.id}</span>
            </Link>
          ) : <div className="flex-1" />}

          {nextCh ? (
            <Link 
              to={`/read/${slug}/${nextCh.id}`}
              className="flex-[2] p-6 rounded-[28px] bg-brand-primary text-brand-bg font-lexend font-bold text-center transition-all shadow-lg hover:brightness-110 active:scale-[0.98] flex flex-col items-center justify-center gap-1 order-1 sm:order-2"
            >
              <span className="text-[11px] opacity-70 uppercase tracking-widest">SIRADAKİ BÖLÜM</span>
              <span className="text-xl">Bölüm {nextCh.id}</span>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        <div className="mt-24 pt-12 border-t border-brand-border/20">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-brand-primary" />
            <h3 className="text-2xl font-lexend font-bold text-white">Yorumlar</h3>
          </div>
          <Giscus slug={slug!} chapterId={parseInt(chapterId!)} />
        </div>
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

// --- App Root ---

export default function App() {
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appearance, setAppearance] = useState<AppearanceSettings>(storage.getAppearanceSettings());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const config = THEME_CONFIGS[appearance.theme] || THEME_CONFIGS.material;
    
    root.style.setProperty('--primary-color', appearance.primaryColor);
    root.style.setProperty('--bg-color', config.bg);
    root.style.setProperty('--surface-color', config.surface);
    root.style.setProperty('--surface-variant-color', config.surfaceVariant);
    root.style.setProperty('--card-color', config.card);
    root.style.setProperty('--border-color', config.border);
    root.style.setProperty('--primary-container-color', config.primaryContainer);
    root.style.setProperty('--on-primary-container-color', config.onPrimaryContainer);
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
      <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text-main selection:bg-brand-primary/30 pb-28 lg:pb-0 overflow-x-hidden relative">
        <div className="noise-overlay" />
        <Header search={search} setSearch={setSearch} />
        
        <div className="flex-1 flex w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 overflow-hidden">
          <SideNav 
            session={session} 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
          />
          
          <main className={cn("flex-1 p-0 sm:p-5 md:p-10 overflow-hidden min-w-0")}>
            <div className="p-3 sm:p-0 h-full overflow-y-auto overflow-x-hidden hide-scrollbar">
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Library search={search} setSearch={setSearch} />} />
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
            </div>
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

