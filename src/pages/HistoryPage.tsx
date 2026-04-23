import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { HistoryItem } from '../types';
import { storage } from '../services/storage';
import { syncService } from '../services/sync';
import { api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function HistoryPage({ session }: { session: Session | null }) {
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
                  <img src={api.getCoverUrl(item.slug)} alt={item.novelTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
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
