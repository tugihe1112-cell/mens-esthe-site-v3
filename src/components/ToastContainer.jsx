import React from 'react';
import { useToast } from '../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function ToastContainer() {
  const context = useToast();
  
  // データがない場合は何も表示しない（ここでクラッシュを防ぐ！）
  if (!context || !context.toasts) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`
              pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border backdrop-blur-md
              flex items-center gap-3
              ${toast.type === 'success' ? 'bg-slate-900/90 border-green-500/30 text-green-400' : ''}
              ${toast.type === 'error' ? 'bg-slate-900/90 border-red-500/30 text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-slate-900/90 border-blue-500/30 text-blue-400' : ''}
            `}
          >
            <p className="font-bold text-sm flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="p-1 opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
