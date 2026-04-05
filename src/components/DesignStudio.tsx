import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { type Crop as ReactCropType } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  Plus, BoxSelect, Hand, Crop, RotateCw, Grid3X3, ZoomOut, ZoomIn, 
  Maximize, Trash2, Camera, Upload, CheckLine, Check, FileSearch, Loader2, Sparkles, Navigation
} from 'lucide-react';
import { ImageAngle, AngleLabel } from '../types';
import { cn } from '../lib/utils';
import { Tooltip } from './Tooltip';
import { AngleLabelBadge } from './AngleLabelBadge';

interface DesignStudioProps {
  images: ImageAngle[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onUpload: (files: FileList) => void;
  onUpdateImage: (index: number, updates: Partial<ImageAngle>) => void;
  onDeleteImage: (index: number) => void;
  onAnalyzeProperty: () => void;
  onWalkthrough: () => void;
  isAnalyzing: boolean;
  propertyContext?: any;
}

export function DesignStudio({
  images,
  activeIndex,
  setActiveIndex,
  onUpload,
  onUpdateImage,
  onDeleteImage,
  onAnalyzeProperty,
  onWalkthrough,
  isAnalyzing,
  propertyContext
}: DesignStudioProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImage = images[activeIndex];

  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'crop' | 'perspective'>('select');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState<ReactCropType>();

  const handleZoom = (delta: number) => setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 5));
  
  const imgRef = useRef<HTMLImageElement>(null);

  const applyCrop = async () => {
    if (!imgRef.current || !crop) return;
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;
      
      if (cropWidth <= 0 || cropHeight <= 0) {
        setActiveTool('select');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(
        image,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      const croppedImageUrl = canvas.toDataURL('image/jpeg');
      onUpdateImage(activeIndex, { url: croppedImageUrl });
      setActiveTool('select');
      setCrop(undefined);
    } catch (e) {
      console.error('Crop failed', e);
    }
  };

  return (
    <div className="flex-1 relative bg-neutral-900 overflow-hidden flex flex-col">
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {currentImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {activeTool === 'crop' ? (
              <div className="relative max-w-full max-h-full bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-center overflow-auto p-4 shadow-2xl">
                <ReactCrop crop={crop} onChange={c => setCrop(c)} className="max-w-full max-h-[75vh]">
                  <img ref={imgRef} src={currentImage.url} alt="Crop View" className="max-w-full max-h-[75vh] object-contain" />
                </ReactCrop>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
                  <button onClick={() => { setActiveTool('select'); setCrop(undefined); }} className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl border border-neutral-700 font-bold shadow-xl">Cancel</button>
                  <button onClick={applyCrop} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl shadow-xl shadow-emerald-900/20 font-bold flex items-center gap-2"><Check size={18} /> Apply</button>
                </div>
              </div>
            ) : (
              <div className="relative max-w-full max-h-full shadow-2xl rounded-lg border border-neutral-700 bg-neutral-800" style={{ perspective: '1200px' }}>
                <motion.div
                  drag={activeTool === 'hand'}
                  dragMomentum={false}
                  onDragEnd={(_, info) => setPanOffset(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
                  onPan={activeTool === 'perspective' ? (_, info) => setRotation(prev => ({
                    x: Math.min(Math.max(prev.x - info.delta.y * 0.2, -30), 30),
                    y: Math.min(Math.max(prev.y + info.delta.x * 0.2, -30), 30)
                  })) : undefined}
                  animate={{ scale: zoomLevel, x: panOffset.x, y: panOffset.y, rotateX: rotation.x, rotateY: rotation.y }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={cn("relative preserve-3d", activeTool === 'hand' ? "cursor-grab active:cursor-grabbing" : activeTool === 'perspective' ? "cursor-move" : "cursor-default")}
                >
                  <img src={currentImage.url} alt="View" className="max-w-full max-h-[85vh] object-contain pointer-events-none" />
                  <AnimatePresence>
                    {showGrid && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)`, backgroundSize: `${40 / zoomLevel}px ${40 / zoomLevel}px` }} />
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10 z-20">
                  ZOOM: {zoomLevel.toFixed(1)}x
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <Camera className="text-neutral-500 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Property Photos</h2>
              <p className="text-neutral-400 text-sm">Add multiple angles (front, back, sides) to give the AI context about the entire property.</p>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Upload size={20} /> Upload Photos
            </button>
            <input type="file" ref={fileInputRef} onChange={e => e.target.files && onUpload(e.target.files)} className="hidden" accept="image/*" multiple />
          </div>
        )}

        {currentImage && (
          <div className="absolute bottom-6 left-6 flex gap-2 z-30">
            <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-lg backdrop-blur">
              <Tooltip text="Select"><button onClick={() => setActiveTool('select')} className={cn("p-3 transition-all border-r border-neutral-700", activeTool === 'select' ? "bg-emerald-600/80 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700")}><BoxSelect size={20} /></button></Tooltip>
              <Tooltip text="Pan"><button onClick={() => setActiveTool('hand')} className={cn("p-3 transition-all border-r border-neutral-700", activeTool === 'hand' ? "bg-emerald-600/80 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700")}><Hand size={20} /></button></Tooltip>
              <Tooltip text="Crop"><button onClick={() => setActiveTool('crop')} className={cn("p-3 transition-all border-r border-neutral-700", activeTool === 'crop' ? "bg-emerald-600/80 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700")}><Crop size={20} /></button></Tooltip>
              <Tooltip text="Perspective"><button onClick={() => setActiveTool('perspective')} className={cn("p-3 transition-all", activeTool === 'perspective' ? "bg-emerald-600/80 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700")}><RotateCw size={20} /></button></Tooltip>
            </div>
            <Tooltip text="Toggle grid"><button onClick={() => setShowGrid(!showGrid)} className={cn("p-3 rounded-xl border transition-all flex items-center shadow-lg backdrop-blur", showGrid ? "bg-emerald-600/80 border-emerald-500/50 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700")}><Grid3X3 size={20} /></button></Tooltip>
            <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-lg backdrop-blur">
              <Tooltip text="Zoom Out"><button onClick={() => handleZoom(-0.2)} className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-r border-neutral-700"><ZoomOut size={20} /></button></Tooltip>
              <Tooltip text="Reset"><button onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); setRotation({ x: 0, y: 0 }); }} className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-r border-neutral-700"><Maximize size={20} /></button></Tooltip>
              <Tooltip text="Zoom In"><button onClick={() => handleZoom(0.2)} className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"><ZoomIn size={20} /></button></Tooltip>
            </div>
            <Tooltip text="Delete active angle"><button onClick={() => onDeleteImage(activeIndex)} className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-all shadow-lg backdrop-blur"><Trash2 size={20} /></button></Tooltip>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="h-28 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 p-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin hide-scroll-arrows flex-1">
            <Tooltip text="Add angle">
              <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-24 h-16 rounded-xl border border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-900/10 transition-all">
                <Plus size={20} />
              </button>
            </Tooltip>
            {images.map((img, i) => (
              <div key={img.id} className="relative flex-shrink-0 group">
                <button
                  onClick={() => setActiveIndex(i)}
                  className={cn("w-24 h-16 rounded-xl overflow-hidden border-2 transition-all block", i === activeIndex ? "border-emerald-500 scale-105 shadow-xl shadow-emerald-900/30" : "border-neutral-800 hover:border-neutral-600")}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt={img.name} />
                </button>
                <div className="absolute -bottom-2 -left-1 z-10 scale-[0.8]">
                  <AngleLabelBadge 
                    label={img.label} 
                    customLabelName={img.customLabelName} 
                    onUpdate={(l, c) => onUpdateImage(i, { label: l, customLabelName: c })} 
                  />
                </div>
              </div>
            ))}
            <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files) onUpload(e.target.files); e.target.value=''; }} className="hidden" accept="image/*" multiple />
          </div>

          <div className="flex flex-col gap-2 pl-6 ml-4 border-l border-neutral-800 shrink-0">
            {images.length > 1 && (
              <button onClick={onWalkthrough} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
                <Navigation size={14} className="text-emerald-400" /> Virtual Walkthrough
              </button>
            )}
            <button 
              onClick={onAnalyzeProperty} 
              disabled={isAnalyzing || propertyContext != null}
              className={cn("flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold transition-all whitespace-nowrap", propertyContext ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400 cursor-default" : isAnalyzing ? "bg-neutral-800 border-neutral-700 text-neutral-400" : "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700")}
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <Sparkles size={14} className={propertyContext ? "text-emerald-400" : "text-amber-400"} />}
              {propertyContext ? 'Property Context Active' : isAnalyzing ? 'Analyzing Property...' : 'Analyze Property Context'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
