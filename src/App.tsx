import React, { useState, useRef, useEffect } from 'react';
import { 
  Layout, 
  Calculator, 
  Image as ImageIcon, 
  MessageSquare, 
  Grid3X3, 
  Upload, 
  Send, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Download,
  Trash2,
  Plus,
  DollarSign,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { editLandscapeImage, generateInitialLandscape } from './services/geminiService';
import { Material, ProjectData, DEFAULT_MATERIALS } from './types';
import Markdown from 'react-markdown';

type ViewMode = 'design' | 'business';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Business State
  const [projectData, setProjectData] = useState<ProjectData>({
    zipCode: '',
    materials: [...DEFAULT_MATERIALS],
    laborRate: 65,
    laborHours: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImage(event.target?.result as string);
        setMessages([{ role: 'ai', content: "I've uploaded your property photo. What design changes would you like to explore? You can ask for things like 'add a stone patio', 'replace the lawn with drought-tolerant plants', or 'add a modern retaining wall'." }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMsg = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      if (!currentImage) {
        // Generate initial image if none exists
        const result = await generateInitialLandscape(userMsg);
        if (result.imageUrl) {
          setCurrentImage(result.imageUrl);
          setMessages(prev => [...prev, { role: 'ai', content: result.text || "Here is a design based on your description." }]);
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: "I couldn't generate an image. Please try a different description." }]);
        }
      } else {
        // Edit existing image
        const result = await editLandscapeImage(currentImage, userMsg);
        if (result.imageUrl) {
          setCurrentImage(result.imageUrl);
          setMessages(prev => [...prev, { role: 'ai', content: result.text || "I've updated the design according to your request." }]);
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: "I encountered an error updating the image. Please try again." }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: "An error occurred while processing your request." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateMaterialQuantity = (id: string, quantity: number) => {
    setProjectData(prev => ({
      ...prev,
      materials: prev.materials.map(m => m.id === id ? { ...m, quantity } : m)
    }));
  };

  const calculateTotal = () => {
    const materialsTotal = projectData.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0);
    const laborTotal = projectData.laborRate * projectData.laborHours;
    return materialsTotal + laborTotal;
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <Layout className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TerraForm</h1>
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest">Landscape Designer</p>
          </div>
        </div>

        <nav className="flex bg-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('design')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              viewMode === 'design' ? "bg-emerald-600 text-white shadow-md" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <ImageIcon size={18} />
            <span className="text-sm font-medium">Design Studio</span>
          </button>
          <button 
            onClick={() => setViewMode('business')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              viewMode === 'business' ? "bg-emerald-600 text-white shadow-md" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Calculator size={18} />
            <span className="text-sm font-medium">Business Manager</span>
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-neutral-500 uppercase font-mono">Project Total</span>
            <span className="text-lg font-bold text-emerald-400">${calculateTotal().toLocaleString()}</span>
          </div>
          <button className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
            <Download size={20} className="text-neutral-300" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === 'design' ? (
          <>
            {/* Design Canvas */}
            <div className="flex-1 relative bg-neutral-900 overflow-hidden flex items-center justify-center">
              {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-neutral-700">
                    <img 
                      src={currentImage} 
                      alt="Landscape View" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Grid Overlay */}
                    <AnimatePresence>
                      {showGrid && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.3 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Scale Reference */}
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10">
                      GRID SCALE: 1 UNIT = 3 FT
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                    <Upload className="text-neutral-500 w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Start Your Design</h2>
                    <p className="text-neutral-400">Upload a photo of your property or describe it in the chat to begin your transformation.</p>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      Upload Photo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>
              )}

              {/* Canvas Controls */}
              <div className="absolute bottom-6 left-6 flex gap-2">
                <button 
                  onClick={() => setShowGrid(!showGrid)}
                  className={cn(
                    "p-3 rounded-xl border transition-all flex items-center gap-2",
                    showGrid 
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20" 
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700"
                  )}
                >
                  <Grid3X3 size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Grid</span>
                </button>
                {currentImage && (
                  <button 
                    onClick={() => setCurrentImage(null)}
                    className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center gap-2"
                  >
                    <Trash2 size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Sidebar */}
            <motion.aside 
              initial={false}
              animate={{ width: isChatOpen ? 400 : 0 }}
              className="bg-neutral-900 border-l border-neutral-800 flex flex-col relative"
            >
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-12 bg-neutral-800 border border-neutral-700 rounded-l-lg flex items-center justify-center text-neutral-400 hover:text-white z-10"
              >
                {isChatOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              <div className={cn("flex-1 flex flex-col overflow-hidden", !isChatOpen && "invisible")}>
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-500" />
                    <h3 className="font-bold">Design Assistant</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">AI Active</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                      <MessageSquare size={48} className="mb-4 text-neutral-700" />
                      <p className="text-sm">Describe your dream landscape to start designing.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-emerald-600 text-white ml-auto rounded-tr-none" 
                          : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700"
                      )}
                    >
                      <Markdown className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </Markdown>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="bg-neutral-800 text-neutral-200 p-3 rounded-2xl rounded-tl-none border border-neutral-700 max-w-[85%] flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-neutral-500 italic">Visualizing changes...</span>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
                  <div className="relative">
                    <textarea 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="e.g., Add a modern fire pit area with gravel..."
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none h-24"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isProcessing}
                      className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2 text-center">
                    AI can make mistakes. Verify important measurements.
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        ) : (
          /* Business View */
          <div className="flex-1 bg-neutral-950 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Project Estimator</h2>
                  <p className="text-neutral-400">Calculate materials, labor, and overhead for your design.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
                    <MapPin size={18} className="text-emerald-500" />
                    <input 
                      type="text" 
                      placeholder="ZIP Code" 
                      value={projectData.zipCode}
                      onChange={(e) => setProjectData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="bg-transparent border-none focus:outline-none text-sm w-24 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Materials Table */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-800/30 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2">
                        <ImageIcon size={18} className="text-emerald-500" />
                        Materials List
                      </h3>
                      <button className="text-xs text-emerald-500 font-bold hover:text-emerald-400 flex items-center gap-1">
                        <Plus size={14} /> Add Custom
                      </button>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
                          <th className="px-6 py-3">Material</th>
                          <th className="px-6 py-3">Unit Price</th>
                          <th className="px-6 py-3">Quantity</th>
                          <th className="px-6 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {projectData.materials.map((m) => (
                          <tr key={m.id} className="group hover:bg-neutral-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-sm">{m.name}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">Per {m.unit}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono">${m.unitPrice.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={m.quantity || ''}
                                onChange={(e) => updateMaterialQuantity(m.id, parseFloat(e.target.value) || 0)}
                                className="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-neutral-300">
                              ${(m.unitPrice * m.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Labor Section */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Layout size={18} className="text-emerald-500" />
                      Labor & Logistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs text-neutral-500 uppercase font-mono">Labor Rate ($/hr)</label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                          <input 
                            type="number" 
                            value={projectData.laborRate}
                            onChange={(e) => setProjectData(prev => ({ ...prev, laborRate: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-neutral-500 uppercase font-mono">Estimated Hours</label>
                        <input 
                          type="number" 
                          value={projectData.laborHours}
                          onChange={(e) => setProjectData(prev => ({ ...prev, laborHours: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="space-y-6">
                  <div className="bg-emerald-600 rounded-3xl p-8 shadow-2xl shadow-emerald-900/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                      <h3 className="text-emerald-100 font-mono text-xs uppercase tracking-widest mb-2">Project Estimate</h3>
                      <div className="text-5xl font-bold mb-6">${calculateTotal().toLocaleString()}</div>
                      
                      <div className="space-y-3 border-t border-emerald-500/50 pt-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-100">Materials</span>
                          <span className="font-mono">${projectData.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-100">Labor</span>
                          <span className="font-mono">${(projectData.laborRate * projectData.laborHours).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/30">
                          <span className="text-emerald-100">Tax (Est. 8%)</span>
                          <span className="font-mono">${(calculateTotal() * 0.08).toLocaleString()}</span>
                        </div>
                      </div>

                      <button className="w-full bg-white text-emerald-700 font-bold py-4 rounded-2xl mt-8 hover:bg-emerald-50 transition-all shadow-xl">
                        Generate Quote PDF
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Market Context</h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                        <p className="text-xs text-neutral-400 mb-1">Local Material Index ({projectData.zipCode || 'Global'})</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[65%]" />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">+2.4%</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        Prices are estimated based on regional averages. Actual quotes from suppliers may vary by 10-15%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
