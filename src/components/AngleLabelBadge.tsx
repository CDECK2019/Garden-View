import React, { useState } from 'react';
import { AngleLabel, ANGLE_LABEL_DISPLAY } from '../types';
import { ChevronDown, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AngleLabelBadgeProps {
  label: AngleLabel;
  customLabelName?: string;
  onUpdate: (label: AngleLabel, customName?: string) => void;
  className?: string;
}

export function AngleLabelBadge({ label, customLabelName, onUpdate, className }: AngleLabelBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customText, setCustomText] = useState(customLabelName || '');

  const display = label === 'custom' ? (customLabelName || 'Custom') : ANGLE_LABEL_DISPLAY[label];

  const presets: AngleLabel[] = ['front', 'entrance', 'side-left', 'side-right', 'back', 'garden', 'pool', 'aerial', 'custom'];

  return (
    <div className={cn("relative group", className)}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded border border-white/20 text-white hover:bg-black/80 transition-all font-medium text-[10px] uppercase tracking-wider"
      >
        <Tag size={10} className="text-emerald-400" />
        {display}
        <ChevronDown size={10} className="opacity-50 group-hover:opacity-100" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 text-left"
            onClick={e => e.stopPropagation()}
          >
            {isEditingCustom ? (
              <div className="p-3">
                <input
                  autoFocus
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="e.g. Balcony"
                  className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingCustom(false)} className="flex-1 text-[10px] py-1 text-neutral-400 border border-neutral-700 rounded hover:bg-neutral-800">Cancel</button>
                  <button 
                    onClick={() => {
                      if (customText.trim()) {
                        onUpdate('custom', customText.trim());
                        setIsOpen(false);
                      }
                    }} 
                    className="flex-1 text-[10px] py-1 bg-emerald-600 text-white rounded font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-1 max-h-48 overflow-y-auto scrollbar-thin">
                <div className="px-2 py-1.5 text-[8px] font-mono text-neutral-500 uppercase">Select Angle</div>
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      if (p === 'custom') {
                        setIsEditingCustom(true);
                      } else {
                        onUpdate(p);
                        setIsOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between",
                      label === p ? "bg-emerald-600/20 text-emerald-400 font-medium" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    )}
                  >
                    {ANGLE_LABEL_DISPLAY[p]}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
