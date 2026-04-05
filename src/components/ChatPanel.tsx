import React, { useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, Sparkles, Image as ImageIcon, Layers } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSendMessage: (msg: string, applyToAll: boolean) => void;
  isOpen: boolean;
}

const QUICK_PROMPTS = [
  "Add modern fire pit",
  "Native drought-tolerant plants",
  "Stone pathway to back",
  "Night mode lighting",
];

export function ChatPanel({ messages, isProcessing, onSendMessage, isOpen }: ChatPanelProps) {
  const [input, setInput] = React.useState('');
  const [applyToAll, setApplyToAll] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim(), applyToAll);
    setInput('');
  };

  return (
    <div className={cn("flex-1 flex flex-col overflow-hidden h-full", !isOpen && "hidden")}>
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-emerald-500" />
          <h3 className="font-bold">Design Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          {isProcessing ? (
            <Loader2 size={14} className="text-emerald-500 animate-spin" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="text-[10px] font-mono text-neutral-500 uppercase">
            {isProcessing ? 'Processing' : 'AI Active'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <Sparkles size={48} className="mb-4 text-emerald-700/50" />
            <p className="text-sm font-medium">TerraForm AI is ready.</p>
            <p className="text-xs text-neutral-400 mt-2">Describe your changes. I can edit this specific angle or apply the concept across the entire property.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn(
              "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white ml-auto rounded-tr-none" 
                : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700"
            )}
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <Markdown>{msg.content}</Markdown>
            </div>
            {msg.appliedToAngles && msg.appliedToAngles.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] flex items-center gap-1 font-mono text-emerald-200/70">
                <Layers size={10} /> Edited {msg.appliedToAngles.length} angle(s)
              </div>
            )}
          </motion.div>
        ))}
        
        {isProcessing && (
          <div className="bg-neutral-800 text-neutral-200 p-3 rounded-2xl rounded-tl-none border border-neutral-700 max-w-[85%] flex flex-col gap-2">
            <div className="flex gap-1 items-center h-4">
              <motion.div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
              <motion.div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Visualizing...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-900">
        <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-thin hide-scroll-arrows">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => { setInput(p); scrollRef.current?.focus(); }}
              className="whitespace-nowrap flex-shrink-0 text-[10px] px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-emerald-600/20 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Target:</span>
          <div className="flex bg-neutral-800 rounded-lg p-0.5 border border-neutral-700">
            <button
              onClick={() => setApplyToAll(false)}
              className={cn("px-3 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", 
                !applyToAll ? "bg-neutral-600 text-white shadow" : "text-neutral-400 hover:text-white")}
            >
              <ImageIcon size={10} /> Active Image
            </button>
            <button
              onClick={() => setApplyToAll(true)}
              className={cn("px-3 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", 
                applyToAll ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white")}
            >
              <Layers size={10} /> All Angles
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={applyToAll ? "Instruct AI to edit all angles..." : "Instruct AI to edit this angle..."}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none h-20"
          />
          <div className="absolute bottom-2 right-2">
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
