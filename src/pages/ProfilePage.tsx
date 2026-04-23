import React from 'react';
import { User, LogOut, Settings, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { AppearanceSettings } from '../types';
import { supabase } from '../lib/supabase';
import { storage } from '../services/storage';
import { cn } from '../lib/utils';

export default function ProfilePage({ 
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
