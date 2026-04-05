import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ProgressItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ProgressOverlayProps {
  items: ProgressItem[];
  title?: string;
}

export function ProgressOverlay({ items, title = 'Applying AI Edits' }: ProgressOverlayProps) {
  const done = items.filter(i => i.status === 'done' || i.status === 'error').length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-emerald-400 w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold mb-1">{title}</h3>
          <p className="text-sm text-neutral-400">
            {done} of {total} angles complete
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Per-image status */}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {item.status === 'done' ? (
                  <CheckCircle size={20} className="text-emerald-400" />
                ) : item.status === 'error' ? (
                  <CheckCircle size={20} className="text-red-400" />
                ) : item.status === 'processing' ? (
                  <Loader2 size={20} className="text-emerald-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-700" />
                )}
              </div>
              <span className={
                item.status === 'done' ? 'text-sm text-neutral-300 line-through decoration-emerald-500/50' :
                item.status === 'processing' ? 'text-sm text-white font-medium' :
                item.status === 'error' ? 'text-sm text-red-400' :
                'text-sm text-neutral-500'
              }>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
