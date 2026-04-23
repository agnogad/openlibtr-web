import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const hasPrompted = localStorage.getItem('okuttur-pwa-prompt-dismissed');
    if (hasPrompted) return;

    // --- Android / Chrome Logic ---
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // --- iOS Safari Logic ---
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    // If it's iOS, not in standalone mode (not installed yet), and we haven't prompted
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      // Optional: Add a small delay so it doesn't pop up immediately on first load
      setTimeout(() => setShowPrompt(true), 3000); 
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA install');
      }
      setDeferredPrompt(null);
    }
    closePrompt();
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('okuttur-pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[100]"
      >
        <div className="m3-card p-5 bg-brand-surface shadow-2xl border border-brand-primary/20 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <button 
            onClick={closePrompt}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-brand-surface-variant/50 text-brand-text-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 pr-6">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20">
              <Download className="w-6 h-6 text-brand-primary" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-lexend font-bold text-white mb-1">Uygulamayı Yükle</h4>
              
              {isIos ? (
                <p className="text-xs text-brand-text-muted leading-relaxed font-lexend mb-4">
                  Daha iyi bir okuma deneyimi için uygulamayı ana ekranınıza ekleyin. Alt menüden 
                  <Share className="w-3 h-3 inline mx-1" /> ikonuna dokunup <strong>"Ana Ekrana Ekle"</strong>yi seçin.
                </p>
              ) : (
                <>
                  <p className="text-xs text-brand-text-muted leading-relaxed font-lexend mb-4">
                    Ana ekranınıza ekleyerek daha hızlı ve çevrimdışı okuma deneyiminin tadını çıkarın.
                  </p>
                  <button 
                    onClick={handleInstall}
                    className="w-full py-2 bg-brand-primary text-brand-bg rounded-xl text-xs font-lexend font-bold uppercase tracking-widest shadow-md hover:brightness-110 transition-all"
                  >
                    Hemen Yükle
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
