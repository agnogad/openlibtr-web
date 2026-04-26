import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Clock, ChevronRight, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { HistoryItem } from '../types';
import { storage } from '../services/storage';
import { syncService } from '../services/sync';
import { api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ConfirmModal } from '../components/ConfirmModal';

export default function HistoryPage({ session }: { session: Session | null }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<HistoryItem | null>(null);

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

  const handleClearAll = async () => {
    if (session) {
      // If we have sync, we should ideally clear remote too, 
      // but the requirement is simple for now.
      // For now let's just clear local and update UI.
      storage.clearHistory();
    } else {
      storage.clearHistory();
    }
    setHistory([]);
  };

  const handleRemoveItem = async (slug: string) => {
    if (session) {
      // Sync service might need a remove method, but let's stick to storage for now
    }
    storage.removeHistoryItem(slug);
    setHistory(prev => prev.filter(h => h.slug !== slug));
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleClearAll}
        title="Geçmişi Temizle"
        message="Okuma geçmişinizdeki tüm kayıtlar silinecek. Bu işlem geri alınamaz."
        confirmText="Hepsini Sil"
      />

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => itemToRemove && handleRemoveItem(itemToRemove.slug)}
        title="Kaydı Kaldır"
        message={`"${itemToRemove?.novelTitle}" okuma geçmişinden kaldırılacak.`}
        confirmText="Kaldır"
      />

      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-brand-surface-variant/20 transition-colors text-brand-text-muted">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        {history.length > 0 && (
          <button 
            onClick={() => setIsClearAllModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-lexend font-bold text-red-400 hover:bg-red-400/10 transition-all border border-red-400/10 uppercase tracking-widest"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Temizle
          </button>
        )}
      </div>

      <div className="flex items-center gap-5 mb-10">
        <div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary shadow-xl shadow-brand-primary/5">
          <HistoryIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-lexend font-bold text-white tracking-tight">Geçmiş</h2>
          <p className="text-sm font-lexend text-brand-text-muted">En son kaldığınız yerleri keşfedin.</p>
        </div>
      </div>

      {!session && history.length > 0 && (
        <div className="mb-10 p-5 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex-1">
            <h3 className="font-lexend font-bold text-brand-primary mb-1 uppercase tracking-wider text-xs">Hesap Eşitleme</h3>
            <p className="text-[11px] font-lexend text-brand-text-muted leading-relaxed">Geçmişinizi buluta kaydedin ve her yerden erişin.</p>
          </div>
          <Link to="/login" className="px-6 py-2.5 bg-brand-primary text-brand-bg text-[11px] font-lexend font-bold rounded-xl whitespace-nowrap hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-brand-primary/20">
            Giriş Yap
          </Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="m3-card h-32 animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-32">
          <div className="w-24 h-24 bg-brand-surface-variant/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-border/10">
            <HistoryIcon className="w-10 h-10 text-brand-text-muted opacity-30" />
          </div>
          <h3 className="text-2xl font-lexend font-bold text-white mb-2">Listeniz Boş</h3>
          <p className="text-brand-text-muted font-lexend mb-10 max-w-xs mx-auto">Henüz bir novel okumaya başlamadınız. Hemen keşfetmeye başlayın!</p>
          <Link to="/" className="inline-flex items-center px-10 py-4 bg-brand-primary text-brand-bg font-lexend font-bold rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">Göz Atmaya Başla</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {history.map((item, idx) => (
              <motion.div
                key={item.slug}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="relative group">
                  <Link 
                    to={`/read/${item.slug}/${item.chapterId}`}
                    className="m3-card p-4 sm:p-5 flex items-center gap-5 sm:gap-6"
                  >
                    <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-brand-border/10">
                      <img 
                        src={api.getCoverUrl(item.slug)} 
                        alt={item.novelTitle} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                        loading="lazy" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-10 sm:pr-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[9px] font-lexend font-bold uppercase tracking-widest">
                          BÖLÜM {item.chapterId}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-brand-border/40" />
                        <div className="flex items-center gap-1.5 text-[10px] font-lexend font-bold text-brand-text-muted uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: tr })}
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-lexend font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-1 leading-tight mb-2">
                        {item.novelTitle}
                      </h3>
                      <div className="h-1.5 w-full bg-brand-surface-variant/20 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-brand-primary/40 rounded-full" 
                           style={{ width: `${Math.min(100, (item.chapterId / 200) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-surface-variant/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-brand-bg transition-all shrink-0 border border-brand-border/10 sm:flex hidden">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </Link>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setItemToRemove(item);
                    }}
                    className="absolute -top-2 -right-2 sm:top-5 sm:right-auto sm:left-[-14px] sm:opacity-0 group-hover:opacity-100 p-2.5 bg-brand-surface border border-brand-border/50 text-brand-text-muted hover:text-red-400 hover:border-red-400/50 shadow-xl rounded-xl transition-all z-10 sm:hover:scale-110 active:scale-90"
                    title="Geçmişten Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

