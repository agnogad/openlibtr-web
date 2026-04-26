import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
          button: 'bg-yellow-500 hover:bg-yellow-600 text-black',
          bg: 'bg-yellow-500/10 border-yellow-500/20'
        };
      case 'info':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-400" />,
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          bg: 'bg-blue-500/10 border-blue-500/20'
        };
      default: // danger
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
          button: 'bg-red-500 hover:bg-red-600 text-white',
          bg: 'bg-red-500/10 border-red-500/20'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-brand-surface border border-brand-border/30 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${styles.bg}`}>
                    {styles.icon}
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-brand-surface-variant/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-brand-text-muted" />
                  </button>
                </div>
                
                <h3 className="text-xl font-lexend font-bold text-white mb-2">{title}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed mb-8">
                  {message}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl bg-brand-surface-variant/20 text-white font-lexend font-bold text-xs uppercase tracking-widest hover:bg-brand-surface-variant/30 transition-all"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-lexend font-bold text-xs uppercase tracking-widest transition-all ${styles.button}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
