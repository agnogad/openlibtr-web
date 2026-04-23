import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
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
