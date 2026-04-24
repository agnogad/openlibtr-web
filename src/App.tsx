import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Book, History as HistoryIcon, Search, Home, User, Menu, Play, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { AppearanceSettings } from './types';
import { storage } from './services/storage';
import { supabase } from './lib/supabase';
import { cn } from './lib/utils';
import InstallPrompt from './components/InstallPrompt';

// Lazy loaded Pages
const Library = lazy(() => import('./pages/Library'));
const NovelDetails = lazy(() => import('./pages/NovelDetails'));
const Reader = lazy(() => import('./pages/Reader'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

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

// --- App Root ---

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

function DynamicTitle() {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    let title = 'OKUTTUR | Modern Light Novel Platformu';
    
    if (path === '/') {
      title = 'OKUTTUR | Keşfet';
    } else if (path === '/history') {
      title = 'OKUTTUR | Okuma Geçmişi';
    } else if (path === '/profile') {
      title = 'OKUTTUR | Profilim';
    } else if (path === '/login') {
      title = 'OKUTTUR | Giriş Yap';
    } else if (path.startsWith('/novel/')) {
      title = 'OKUTTUR | Novel Detayları';
    } else if (path.startsWith('/read/')) {
      title = 'OKUTTUR | Okunuyor';
    }
    
    document.title = title;
  }, [location]);

  return null;
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
      if (authLoading) setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [authLoading]);

  return (
    <Router>
      <DynamicTitle />
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
                <Suspense fallback={
                  <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Library search={search} setSearch={setSearch} />} />
                    <Route path="/novel/:slug" element={<NovelDetails session={session} />} />
                    <Route path="/read/:slug/:chapterId" element={<Reader session={session} />} />
                    <Route path="/login" element={session ? <Navigate to="/profile" /> : <AuthPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/history" element={session ? <HistoryPage session={session} /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={session ? <ProfilePage session={session} appearance={appearance} setAppearance={setAppearance} /> : <Navigate to="/login" />} />

                    {/* Redirect any other path to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </div>
          </main>
        </div>

        <BottomNav session={session} />
        
        <InstallPrompt />

        <footer className={cn("py-12 border-t border-brand-border text-center hidden lg:block", !session && "block")}>
          <p className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">
            &copy; 2026 OKUTTUR &bull; Database from <a href="https://github.com/agnogad/openlibtr" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">openlibtr</a>
          </p>
        </footer>
      </div>
    </Router>
  );
}

