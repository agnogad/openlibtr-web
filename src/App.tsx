import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Book, History, Search, ArrowLeft, ChevronRight, ChevronLeft, Bookmark, Home, User, Settings, ExternalLink, LogOut, LogIn, Menu, X, Check, Play } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-[2.5rem] bg-[#0a0a0a] border border-brand-border shadow-[0_30px_70px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
             <LogIn className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2 italic">
            {isSignUp ? 'Katıl' : 'Hoş Geldin'}
          </h2>
          <p className="text-brand-text-muted text-xs font-medium uppercase tracking-[2px]">
            {isSignUp ? 'YENI BIR MACERAYA BAŞLAYIN' : 'OKUMAYA DEVAM ETMEK IÇIN GIRIŞ YAPIN'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[3px] text-brand-text-muted/50 ml-4">Giriş Kimliği</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-zinc-600 font-medium"
              placeholder="E-posta adresiniz"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[3px] text-brand-text-muted/50 ml-4">Güvenlik Anahtarı</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-zinc-600 font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-[11px] font-bold text-center bg-red-400/10 py-3 rounded-xl border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-brand-primary text-black font-black uppercase text-xs tracking-[3px] rounded-2xl shadow-[0_10px_30px_rgba(56,189,248,0.2)] hover:shadow-brand-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Sistem Doğrulanıyor...' : (isSignUp ? 'Kayıt İşlemini Tamamla' : 'Sisteme Bağlan')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors py-2"
          >
            {isSignUp ? 'Hesabınız var mı? Giriş Yap' : 'Henüz üye değil misiniz? Kayıt Ol'}
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
      <div className="space-y-10">
        {/* User Card */}
        <div className="relative group p-10 rounded-[2.5rem] bg-[#0a0a0a] border border-brand-border text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <User className="w-48 h-48 text-brand-primary" strokeWidth={1} />
          </div>
          
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 bg-brand-primary/10 border-2 border-brand-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-500">
              <User className="text-brand-primary w-12 h-12" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-2 italic">Kontrol Merkezi</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
               <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{session.user.email}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all font-black text-[10px] uppercase tracking-[2px]"
            >
              <LogOut className="w-4 h-4" />
              SİSTEMDEN AYRIL
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-8 rounded-[2rem] bg-brand-surface/30 border border-brand-border">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-8 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Görünüm Arayüzü
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.color}
                onClick={() => {
                  const newSettings = { primaryColor: theme.color };
                  setAppearance(newSettings);
                  storage.saveAppearanceSettings(newSettings);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group overflow-hidden",
                  appearance.primaryColor === theme.color
                    ? "border-brand-primary bg-brand-primary/10 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                    : "border-brand-border bg-[#0a0a0a] hover:border-zinc-700"
                )}
              >
                <div 
                  className="w-5 h-5 rounded-full shadow-lg" 
                  style={{ backgroundColor: theme.color }}
                />
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  appearance.primaryColor === theme.color ? "text-brand-primary" : "text-zinc-600"
                )}>{theme.name}</span>
                {appearance.primaryColor === theme.color && (
                   <motion.div layoutId="activeTheme" className="absolute inset-0 bg-brand-primary/5 pointer-events-none" />
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
    { name: 'Keşfet', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: History },
    { name: session ? 'Profil' : 'Giriş', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-8 left-6 right-6 z-50">
      <div className="bg-brand-surface/95 backdrop-blur-3xl border border-brand-border h-20 rounded-[2.5rem] flex items-center justify-around px-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-x-2 inset-y-3 bg-brand-primary/10 rounded-[1.5rem] border border-brand-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className={cn(
                "relative z-10 flex flex-col items-center gap-1 transition-all duration-500",
                isActive ? "text-brand-primary scale-110" : "text-zinc-600 hover:text-zinc-400"
              )}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[2px] leading-none",
                  isActive ? "opacity-100" : "opacity-40"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SideNav({ session }: { session: Session | null }) {
  const location = useLocation();
  const menuItems = [
    { name: 'Ana Menü', path: '/', icon: Home },
    { name: 'Geçmiş', path: '/history', icon: History },
    { name: session ? 'Profil' : 'Giriş', path: '/profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col gap-1 w-80 p-10 border-r border-brand-border h-[calc(100vh-80px)] sticky top-20 scroll-py-8">
      <div className="mb-12">
        <p className="text-[10px] font-black uppercase tracking-[4px] text-zinc-700 mb-6 ml-4">Terminal</p>
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-4 px-6 py-4 rounded-2xl text-[14px] font-bold transition-all group overflow-hidden",
                  isActive
                    ? "bg-brand-primary/5 text-brand-primary border border-brand-primary/20 shadow-[0_0_30px_rgba(56,189,248,0.03)]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebarActive"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-full shadow-[2px_0_15px_rgba(56,189,248,0.5)]"
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                  isActive ? "text-brand-primary" : "text-zinc-700 group-hover:text-brand-primary"
                )} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <div className="p-6 rounded-[2rem] bg-brand-surface border border-brand-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center shrink-0">
               <User className="w-5 h-5 text-zinc-600" />
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none truncate mb-1">
                 {session ? (session.user.email?.split('@')[0]) : 'Misafir'}
               </span>
               <div className="flex items-center gap-1.5 leading-none">
                 <span className={cn("w-1 h-1 rounded-full", session ? "bg-brand-primary" : "bg-zinc-600")} />
                 <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                   {session ? 'IDENTIFIED' : 'ANONYMOUS'}
                 </span>
               </div>
             </div>
          </div>
          {!session && (
            <Link to="/login" className="block w-full py-3 bg-brand-primary/5 hover:bg-brand-primary/10 text-center rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/10 transition-all">
              Initialize Auth
            </Link>
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
    <header className="glass-header h-20 flex items-center shrink-0 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-4 group shrink-0">
          <div className="relative">
            <div className="w-4 h-4 bg-brand-primary rounded-sm shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:rotate-90 transition-transform duration-700" />
            <div className="absolute inset-0 w-4 h-4 border border-white/20 rounded-sm group-hover:scale-150 group-hover:opacity-0 transition-all duration-700" />
          </div>
          <span className="text-2xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
            OKUTTUR
          </span>
        </Link>
        
        <div className="hidden lg:block flex-1 max-w-xl relative group">
          <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4 group-focus-within:text-brand-primary transition-colors z-10" />
          <input 
            type="text"
            placeholder="Kütüphanede ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-brand-border rounded-2xl py-3 pl-12 pr-4 text-sm text-brand-text-main placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/5 transition-all font-sans relative z-10"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-brand-border bg-brand-surface text-[8px] font-bold text-zinc-600 tracking-widest uppercase z-10 pointer-events-none">
            CMD+K
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[9px] text-brand-primary font-bold uppercase tracking-tighter">Online</span>
            </div>
          </div>
          <Link to="/profile" className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all group overflow-hidden relative">
            <User className="text-brand-text-muted w-5 h-5 group-hover:text-brand-primary transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
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
    <div className="flex flex-col gap-14">
      {/* Resume Section */}
      {resume && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-12 overflow-hidden shadow-2xl transition-all duration-500 hover:border-brand-primary/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative w-36 h-52 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] shrink-0 border border-brand-border group-hover:scale-105 transition-transform duration-700">
              <img src={api.getCoverUrl(resume.slug)} alt={resume.novelTitle} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <Bookmark className="w-3 h-3" />
                Okumaya Devam Et
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-2 leading-tight">{resume.novelTitle}</h3>
              <p className="text-sm text-brand-text-muted mb-6">Bölüm {resume.chapterId} / Güncel</p>
              
              <div className="hidden md:flex flex-col gap-2">
                <div className="w-full max-w-sm h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-brand-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                  />
                </div>
                <div className="flex justify-between max-w-sm text-[10px] font-bold text-brand-text-muted/50 uppercase tracking-tighter">
                  <span>Başlangıç</span>
                  <span>Hedef: Tamamlama</span>
                </div>
              </div>
            </div>
            
            <Link 
              to={`/read/${resume.slug}/${resume.chapterId}`}
              className="relative z-10 px-10 py-4 bg-brand-primary text-black font-black uppercase text-xs tracking-widest rounded-full hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95 transition-all shrink-0"
            >
              Macera'ya Dön
            </Link>
          </div>
        </motion.div>
      )}

      {/* Popüler Noveller Grid */}
      <div>
        <h2 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
          Popüler Noveller
        </h2>

        {/* Mobile Search Bar */}
        <div className="lg:hidden mb-10 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted w-4 h-4 group-focus-within:text-brand-primary transition-colors z-10" />
          <input 
            type="text"
            placeholder="Kütüphanede ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm text-brand-text-main placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary/40 transition-all font-sans relative z-10 shadow-2xl"
          />
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[2/3] bg-brand-card rounded-2xl animate-pulse" />
                <div className="h-4 bg-brand-card rounded-full w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-y-12 gap-x-8">
          {filteredNovels.map((novel, idx) => (
            <motion.div
              key={novel.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link 
                to={`/novel/${novel.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[10/14] rounded-3xl overflow-hidden mb-5 bg-brand-card border border-brand-border group-hover:border-brand-primary/30 transition-all duration-500 shadow-2xl group-hover:shadow-brand-primary/5">
                  <img 
                    src={api.getCoverUrl(novel.slug)} 
                    alt={novel.title} 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent group-hover:opacity-0 transition-opacity duration-500" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                     <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-brand-primary border border-brand-primary/20 uppercase tracking-widest shadow-lg">
                       {novel.chapterCount} BÖLÜM
                     </span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-sm line-clamp-1 text-zinc-100 group-hover:text-brand-primary transition-colors leading-tight mb-2">
                  {novel.title}
                </h3>
                <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest opacity-60">
                  {new Date(novel.lastUpdated).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric' })}
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white flex items-center gap-3 sm:gap-4">
          <History className="w-6 h-6 sm:w-8 sm:h-8 text-brand-primary shrink-0" />
          Geçmiş
        </h1>
        <button 
          onClick={() => {
            storage.clearHistory();
            setHistory([]);
          }}
          className="w-fit text-[10px] font-black uppercase tracking-[2px] text-red-500 hover:text-white py-2.5 px-6 rounded-full border border-red-500/20 hover:bg-red-500 hover:border-red-500 transition-all font-sans"
        >
          Tümünü Sıfırla
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="h-24 bg-brand-card rounded-2xl animate-pulse border border-brand-border" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 bg-brand-surface rounded-[3rem] border border-brand-border"
        >
          <History className="w-16 h-16 text-brand-text-muted mx-auto mb-6 opacity-10" />
          <p className="text-brand-text-muted font-display font-medium text-lg mb-1">Henüz hiçbir şey okumadınız.</p>
          <p className="text-xs text-brand-text-muted/60 mb-8 font-medium italic">Macera seni bekliyor...</p>
          <Link to="/" className="px-10 py-4 bg-brand-primary text-black font-black uppercase text-[10px] tracking-widest rounded-full hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all">Keşfetmeye Başla</Link>
        </motion.div>
      ) : (
        <div className="grid gap-5">
          {history.map((item, idx) => (
            <motion.div
              key={`${item.slug}-${item.chapterId}-${item.timestamp}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <Link 
                to={`/read/${item.slug}/${item.chapterId}`}
                className="flex items-center gap-4 sm:gap-8 p-4 sm:p-6 rounded-3xl tech-card group relative overflow-hidden min-w-0 w-full"
              >
                <div className="w-12 h-16 sm:w-16 sm:h-24 rounded-xl border border-brand-border/50 overflow-hidden shrink-0 shadow-2xl relative z-10">
                  <img src={api.getCoverUrl(item.slug)} alt={item.novelTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden relative z-10">
                  <h3 className="font-display font-bold text-base sm:text-xl text-zinc-100 group-hover:text-brand-primary transition-colors truncate w-full block leading-none mb-2">
                    {item.novelTitle}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 min-w-0">
                    <span className="text-[9px] sm:text-[11px] font-black text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-widest shrink-0 bg-brand-primary/5">B {item.chapterId}</span>
                    <span className="text-[9px] sm:text-[11px] font-bold text-brand-text-muted uppercase tracking-tighter truncate opacity-40">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-brand-text-muted group-hover:text-brand-primary transition-all group-hover:translate-x-2 shrink-0 relative z-10" />
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

  if (loading) return <div className="p-20 text-center animate-pulse text-brand-text-muted">İçerik hazırlanıyor...</div>;
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
    <div className="flex flex-col md:flex-row gap-16">
      {/* Novel Header Info */}
      <div className="w-full md:w-80 shrink-0">
        <div className="sticky top-24 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-brand-border ring-1 ring-white/5"
          >
            <img src={api.getCoverUrl(config.slug)} alt={novel.title} className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-4 leading-[1.1] tracking-tight">{novel.title}</h1>
            <div className="flex items-center gap-4 text-brand-text-muted text-[10px] font-bold uppercase tracking-[3px] mb-8">
              <span className="flex items-center gap-2">
                <Book className="w-4 h-4 text-brand-primary" />
                {config.total_chapters} BÖLÜM
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-border" />
              <span>GÜNCEL</span>
            </div>
            <div className="flex flex-col gap-3">
              {currentResume ? (
                <Link 
                  to={`/read/${config.slug}/${currentResume.chapterId}`}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-brand-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl text-center shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Devam Et (B{currentResume.chapterId})
                </Link>
              ) : (
                <Link 
                  to={`/read/${config.slug}/${config.chapters[0].id}`}
                  className="block w-full py-5 bg-brand-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl text-center shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  İlk Bölümü Oku
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-brand-border">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
            Bölüm Listesi
          </h2>
          
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="Bölüm ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0a0a0a] border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-brand-text-main placeholder:text-zinc-600 focus:outline-none focus:border-brand-primary/50 transition-all font-sans"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {paginatedChapters.map((ch, idx) => {
            const isRead = readChapters.has(ch.id);
            const isLatest = currentResume?.chapterId === ch.id;
            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (idx % 24) * 0.01, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link 
                  to={`/read/${config.slug}/${ch.id}`}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all group overflow-hidden",
                    isLatest 
                      ? "bg-brand-primary text-black border-brand-primary shadow-[0_0_20px_rgba(56,189,248,0.4)] ring-4 ring-brand-primary/10" 
                      : isRead
                        ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary/60 shadow-inner"
                        : "bg-[#0a0a0a] border-brand-border text-zinc-500 hover:border-brand-primary/40 hover:bg-[#111111] hover:text-brand-primary"
                  )}
                >
                  {isRead && !isLatest && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-[10px] font-black font-mono leading-none mb-1 opacity-20 group-hover:opacity-100 transition-opacity">#{ch.id.toString().padStart(2, '0')}</span>
                  <span className="font-display font-black text-xs sm:text-base tracking-tighter">B {ch.id}</span>
                  <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pb-8">
            <button 
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted disabled:opacity-30 hover:border-brand-primary transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                        page === p 
                          ? "bg-brand-primary text-black" 
                          : "bg-brand-surface text-brand-text-muted border border-brand-border hover:border-brand-primary/40"
                      )}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 3 || p === page + 3) return <span key={p} className="text-zinc-700">...</span>;
                return null;
              })}
            </div>
            <button 
              onClick={() => {
                setPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted disabled:opacity-30 hover:border-brand-primary transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {filteredChapters.length === 0 && (
          <div className="py-20 text-center text-brand-text-muted italic opacity-50">Sonuç bulunamadı...</div>
        )}
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
  const [showChapters, setShowChapters] = useState(false);

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
          <Link 
            to={`/novel/${slug}`}
            className="flex items-center gap-3 text-brand-text-muted hover:text-white transition-all group"
          >
            <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:border-brand-primary/40 group-hover:bg-brand-primary/5">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[2px]">Geri Dön</span>
          </Link>
          
          <div className="flex flex-col items-center max-w-[60%]">
            <h2 className="text-sm font-display font-bold text-zinc-100 truncate w-full text-center tracking-tight leading-none mb-1">{novel.title}</h2>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
              <span className="text-[10px] text-brand-text-muted font-black uppercase tracking-[3px]">BÖLÜM {chapterId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowChapters(!showChapters)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showChapters ? "bg-brand-primary text-black" : "text-brand-text-muted hover:text-white"
              )}
            >
              <Menu className="w-4 h-4" />
            </button>
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
          {showChapters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-0 right-0 z-40 bg-brand-surface border-b border-brand-border shadow-2xl backdrop-blur-xl"
            >
              <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest">Bölümler</h3>
                  <button onClick={() => setShowChapters(false)} className="text-brand-text-muted hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-[60vh] overflow-y-auto hide-scrollbar p-1">
                  {config.chapters.map((ch) => {
                    const isCurrent = ch.id === parseInt(chapterId!);
                    return (
                      <Link
                        key={ch.id}
                        to={`/read/${slug}/${ch.id}`}
                        onClick={() => setShowChapters(false)}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg border text-[10px] font-black transition-all",
                          isCurrent
                            ? "bg-brand-primary text-black border-brand-primary"
                            : "bg-brand-bg text-brand-text-muted border-brand-border hover:border-brand-primary/40 hover:text-brand-primary"
                        )}
                      >
                        {ch.id}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

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
      <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text-main selection:bg-brand-primary/30 pb-28 lg:pb-0 overflow-x-hidden relative">
        <div className="noise-overlay" />
        <Header search={search} setSearch={setSearch} />
        
        <div className="flex-1 flex w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 overflow-hidden">
          <SideNav session={session} />
          
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

