import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { ImageAngle, ANGLE_LABEL_DISPLAY } from '../types';
import { cn } from '../lib/utils';

interface PropertyWalkthroughProps {
  images: ImageAngle[];
  initialIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export function PropertyWalkthrough({ images, initialIndex, onClose, onSelectIndex }: PropertyWalkthroughProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const goTo = useCallback((index: number, dir: 1 | -1) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % images.length, 1);
  }, [current, images.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + images.length) % images.length, -1);
  }, [current, images.length, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onClose]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, next]);

  const image = images[current];
  const label = ANGLE_LABEL_DISPLAY[image.label] ?? image.customLabelName ?? image.name;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[150] flex flex-col"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-1">Property Walkthrough</div>
          <h2 className="text-2xl font-bold text-white">{label}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Auto-play'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={image.id}
            src={image.url}
            alt={label}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </AnimatePresence>

        {/* Side navigation */}
        <button
          onClick={prev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-all backdrop-blur-sm z-10"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={next}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-all backdrop-blur-sm z-10"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Bottom bar — breadcrumb + thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-6 pb-6 pt-16">
        {/* Breadcrumb trail */}
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                goTo(i, i > current ? 1 : -1);
                onSelectIndex(i);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                i === current
                  ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white backdrop-blur-sm"
              )}
            >
              <span className="font-mono text-[10px] uppercase">{i + 1}</span>
              {ANGLE_LABEL_DISPLAY[img.label] ?? img.customLabelName ?? img.name}
            </button>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={cn(
                "rounded-full transition-all",
                i === current ? "w-6 h-2 bg-emerald-500" : "w-2 h-2 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-3 font-mono">
          ← → ARROW KEYS TO NAVIGATE · SPACE TO AUTO-PLAY · ESC TO EXIT
        </p>
      </div>
    </motion.div>
  );
}
