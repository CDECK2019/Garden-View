import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize,
  MoveHorizontal,
  Camera,
  History,
  Save,
  Grid,
  FolderOpen,
  Clock,
  Hand,
  Crop,
  RotateCw,
  BoxSelect,
  Check,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trees,
  Sun,
  PenTool,
  Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { editLandscapeImage, generateInitialLandscape } from './services/geminiService';
import { 
  Material, 
  DEFAULT_MATERIALS, 
  ImageAngle, 
  Project, 
  ProjectVersion,
  LANDSCAPE_TEMPLATES,
  Template
} from './types';
import Markdown from 'react-markdown';
import Cropper, { Area, Point } from 'react-easy-crop';

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-neutral-700 shadow-xl z-[60] translate-y-1 group-hover:translate-y-0">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
      </div>
    </div>
  );
}

type ViewMode = 'dashboard' | 'design' | 'business';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Manipulation State
  const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'crop' | 'perspective' | 'highlight'>('select');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  // Highlighting State
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // New Project Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Cropping State
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const currentVersion = activeProject?.versions.find(v => v.id === activeProject.currentVersionId);
  
  const images = currentVersion?.images || [];
  const currentImage = images[activeIndex]?.url || null;

  const createProject = (name: string, description: string, templateId?: string | null) => {
    const template = LANDSCAPE_TEMPLATES.find(t => t.id === templateId);
    const initialMaterials = template ? [...template.materials] : [...DEFAULT_MATERIALS];
    
    const newVersion: ProjectVersion = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Initial Version',
      timestamp: Date.now(),
      images: [],
      materials: initialMaterials,
      laborRate: 65,
      laborHours: 0
    };
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      zipCode: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [newVersion],
      currentVersionId: newVersion.id
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setViewMode('design');
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setSelectedTemplateId(null);
  };

  const saveVersion = (name: string) => {
    if (!activeProject || !currentVersion) return;
    const newVersion: ProjectVersion = {
      ...currentVersion,
      id: Math.random().toString(36).substr(2, 9),
      name,
      timestamp: Date.now()
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      versions: [...p.versions, newVersion],
      currentVersionId: newVersion.id,
      updatedAt: Date.now()
    } : p));
  };

  const switchVersion = (versionId: string) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      currentVersionId: versionId
    } : p));
    setActiveIndex(0);
    setZoomLevel(1);
  };

  const startDrawingMask = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'highlight') return;
    setIsDrawingMask(true);
    drawMask(e);
  };

  const stopDrawingMask = () => {
    setIsDrawingMask(false);
    if (maskCanvasRef.current) {
      setMaskImage(maskCanvasRef.current.toDataURL());
    }
  };

  const drawMask = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMask || activeTool !== 'highlight' || !maskCanvasRef.current) return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (('touches' in e) ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (('touches' in e) ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 20 / zoomLevel, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        setMaskImage(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeProjectId || !currentVersion) return;
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage: ImageAngle = {
            id: Math.random().toString(36).substr(2, 9),
            url: event.target?.result as string,
            name: `Angle ${images.length + index + 1}`,
            timestamp: Date.now()
          };
          
          setProjects(prev => prev.map(p => p.id === activeProjectId ? {
            ...p,
            versions: p.versions.map(v => v.id === p.currentVersionId ? {
              ...v,
              images: [...v.images, newImage]
            } : v)
          } : p));

          if (images.length === 0 && index === 0) {
            setMessages([{ role: 'ai', content: "I've uploaded your property photos. You can switch between angles using the gallery below. What design changes would you like to explore?" }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !activeProjectId || !currentVersion) return;

    const userMsg = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      if (!currentImage) {
        const result = await generateInitialLandscape(userMsg);
        if (result.imageUrl) {
          const newImage: ImageAngle = {
            id: Math.random().toString(36).substr(2, 9),
            url: result.imageUrl,
            name: 'Initial Design',
            timestamp: Date.now()
          };
          setProjects(prev => prev.map(p => p.id === activeProjectId ? {
            ...p,
            versions: p.versions.map(v => v.id === p.currentVersionId ? {
              ...v,
              images: [newImage]
            } : v)
          } : p));
          setActiveIndex(0);
          setMessages(prev => [...prev, { role: 'ai', content: result.text || "Here is a design based on your description." }]);
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: "I couldn't generate a visual for that description. Could you try being more specific about the landscape elements?" }]);
        }
      } else {
        const result = await editLandscapeImage(currentImage, userMsg, "image/png", maskImage || undefined);
        if (result.imageUrl) {
          setProjects(prev => prev.map(p => p.id === activeProjectId ? {
            ...p,
            versions: p.versions.map(v => v.id === p.currentVersionId ? {
              ...v,
              images: v.images.map((img, i) => i === activeIndex ? { ...img, url: result.imageUrl } : img)
            } : v)
          } : p));
          setMessages(prev => [...prev, { role: 'ai', content: result.text || "I've updated the design for this angle." }]);
          clearMask();
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: "I was unable to modify the image. Please try a different request." }]);
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
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      versions: p.versions.map(v => v.id === p.currentVersionId ? {
        ...v,
        materials: v.materials.map(m => m.id === id ? { ...m, quantity } : m)
      } : v)
    } : p));
  };

  const calculateTotal = () => {
    if (!currentVersion) return 0;
    const materialsTotal = currentVersion.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0);
    const laborTotal = currentVersion.laborRate * currentVersion.laborHours;
    return materialsTotal + laborTotal;
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const applyCrop = async () => {
    if (!currentImage || !croppedAreaPixels || !activeProjectId || !currentVersion) return;
    
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = currentImage;
      await new Promise((resolve) => (img.onload = resolve));
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      const croppedImageUrl = canvas.toDataURL('image/jpeg');
      
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        versions: p.versions.map(v => v.id === p.currentVersionId ? {
          ...v,
          images: v.images.map((img, i) => i === activeIndex ? { ...img, url: croppedImageUrl } : img)
        } : v)
      } : p));
      
      setActiveTool('select');
      setCrop({ x: 0, y: 0 });
      setCropZoom(1);
    } catch (e) {
      console.error('Failed to crop image', e);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 5));
  };

  const nextAngle = () => {
    setActiveIndex(prev => (prev + 1) % images.length);
    setZoomLevel(1);
  };

  const prevAngle = () => {
    setActiveIndex(prev => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
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
            onClick={() => setViewMode('dashboard')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              viewMode === 'dashboard' ? "bg-emerald-600 text-white shadow-md" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <FolderOpen size={18} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button 
            disabled={!activeProjectId}
            onClick={() => setViewMode('design')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
              viewMode === 'design' ? "bg-emerald-600 text-white shadow-md" : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            <ImageIcon size={18} />
            <span className="text-sm font-medium">Design Studio</span>
          </button>
          <button 
            disabled={!activeProjectId}
            onClick={() => setViewMode('business')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
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
          <Tooltip text="Download Project Report">
            <button className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
              <Download size={20} className="text-neutral-300" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === 'dashboard' ? (
          <div className="flex-1 bg-neutral-950 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Project Dashboard</h2>
                  <p className="text-neutral-400">Manage your landscaping projects and design versions.</p>
                </div>
                <button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                >
                  <Plus size={20} />
                  New Project
                </button>
              </div>

              <AnimatePresence>
                {isNewProjectModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
                    >
                      <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                        <h3 className="text-xl font-bold">Create New Project</h3>
                        <button onClick={() => setIsNewProjectModalOpen(false)} className="text-neutral-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Project Name</label>
                            <input 
                              type="text" 
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="e.g., Smith Backyard Renovation"
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Description</label>
                            <textarea 
                              value={newProjectDesc}
                              onChange={(e) => setNewProjectDesc(e.target.value)}
                              placeholder="Describe the project goals..."
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24 resize-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Select a Design Template (Optional)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {LANDSCAPE_TEMPLATES.map(template => {
                              const Icon = template.id === 'modern' ? Layout : template.id === 'rustic' ? Trees : Sun;
                              return (
                                <button
                                  key={template.id}
                                  onClick={() => setSelectedTemplateId(selectedTemplateId === template.id ? null : template.id)}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 text-left transition-all group",
                                    selectedTemplateId === template.id 
                                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-900/20" 
                                      : "border-neutral-800 bg-neutral-800/50 hover:border-neutral-700"
                                  )}
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                                    selectedTemplateId === template.id ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200"
                                  )}>
                                    <Icon size={20} />
                                  </div>
                                  <h4 className="font-bold text-sm mb-1">{template.name}</h4>
                                  <p className="text-[10px] text-neutral-500 leading-tight">{template.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-neutral-800/50 border-t border-neutral-800 flex gap-3">
                        <button 
                          onClick={() => setIsNewProjectModalOpen(false)}
                          className="flex-1 px-6 py-3 rounded-xl border border-neutral-700 font-bold hover:bg-neutral-800 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={!newProjectName.trim()}
                          onClick={() => createProject(newProjectName, newProjectDesc, selectedTemplateId)}
                          className="flex-[2] px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20"
                        >
                          Create Project
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {projects.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
                    <FolderOpen className="text-neutral-500 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">No Projects Yet</h3>
                  <p className="text-neutral-400 max-w-sm">Create your first project to start visualizing and estimating your landscape designs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <div 
                      key={project.id}
                      className={cn(
                        "bg-neutral-900 border rounded-3xl overflow-hidden transition-all group cursor-pointer",
                        activeProjectId === project.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-neutral-800 hover:border-neutral-700"
                      )}
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setViewMode('design');
                      }}
                    >
                      <div className="h-40 bg-neutral-800 relative overflow-hidden">
                        {project.versions[project.versions.length - 1]?.images[0] ? (
                          <img 
                            src={project.versions[project.versions.length - 1].images[0].url} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={project.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">
                            <ImageIcon size={48} />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10">
                          {project.versions.length} VERSIONS
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-bold mb-1">{project.name}</h4>
                        <p className="text-xs text-neutral-500 mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(project.updatedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MapPin size={10} /> {project.zipCode || 'No Zip'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'design' ? (
          <>
            {/* Design Canvas */}
            <div className="flex-1 relative bg-neutral-900 overflow-hidden flex flex-col">
              {/* Version Selector */}
              <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 flex items-center px-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                    <History size={14} />
                    <span>VERSION:</span>
                    <select 
                      value={activeProject?.currentVersionId}
                      onChange={(e) => switchVersion(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {activeProject?.versions.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <Tooltip text="Save current design as a new version">
                    <button 
                      onClick={() => {
                        const name = prompt('Enter version name:', `Version ${activeProject!.versions.length + 1}`);
                        if (name) saveVersion(name);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider"
                    >
                      <Save size={12} /> Save Current
                    </button>
                  </Tooltip>
                </div>
                <div className="text-[10px] font-mono text-neutral-500">
                  PROJECT: {activeProject?.name.toUpperCase()}
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-neutral-900/50">
                {isProcessing && !currentImage && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-neutral-950/50 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-emerald-500 font-mono text-xs animate-pulse uppercase tracking-widest">Generating Visuals...</p>
                  </div>
                )}
                
                {currentImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
                    {activeTool === 'crop' ? (
                      <div className="relative w-full h-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                        <Cropper
                          image={currentImage}
                          crop={crop}
                          zoom={cropZoom}
                          aspect={4 / 3}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setCropZoom}
                        />
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
                          <button 
                            onClick={() => setActiveTool('select')}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl border border-neutral-700 font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={applyCrop}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl shadow-lg shadow-emerald-900/20 font-bold transition-all flex items-center gap-2"
                          >
                            <Check size={18} />
                            Apply Crop
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center">
                        <div 
                          className="relative shadow-2xl rounded-2xl border border-neutral-700 bg-neutral-800 overflow-hidden flex items-center justify-center" 
                          style={{ 
                            perspective: '1200px',
                            width: 'fit-content',
                            height: 'fit-content',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                        >
                          <motion.div
                            drag={activeTool === 'hand'}
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                              setPanOffset(prev => ({
                                x: prev.x + info.offset.x,
                                y: prev.y + info.offset.y
                              }));
                            }}
                            onPan={activeTool === 'perspective' ? (_, info) => {
                              if (!info.delta) return;
                              setRotation(prev => ({
                                x: Math.min(Math.max(prev.x - (info.delta.y || 0) * 0.2, -30), 30),
                                y: Math.min(Math.max(prev.y + (info.delta.x || 0) * 0.2, -30), 30)
                              }));
                            } : undefined}
                            animate={{ 
                              scale: zoomLevel,
                              x: panOffset.x,
                              y: panOffset.y,
                              rotateX: rotation.x,
                              rotateY: rotation.y,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={cn(
                              "relative preserve-3d flex items-center justify-center",
                              activeTool === 'hand' ? "cursor-grab active:cursor-grabbing" : 
                              activeTool === 'perspective' ? "cursor-move" : "cursor-default"
                            )}
                          >
                            <img 
                              key={currentImage}
                              src={currentImage} 
                              alt="Landscape View" 
                              className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl"
                              referrerPolicy="no-referrer"
                              onLoad={(e) => {
                                console.log('Image loaded successfully');
                                if (maskCanvasRef.current) {
                                  const img = e.target as HTMLImageElement;
                                  maskCanvasRef.current.width = img.naturalWidth;
                                  maskCanvasRef.current.height = img.naturalHeight;
                                }
                              }}
                              onError={(e) => {
                                console.error('Image failed to load');
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/1200/800';
                              }}
                            />
                            
                            {/* Mask Overlay */}
                            <canvas
                              ref={maskCanvasRef}
                              onMouseDown={startDrawingMask}
                              onMouseMove={drawMask}
                              onMouseUp={stopDrawingMask}
                              onMouseLeave={stopDrawingMask}
                              onTouchStart={startDrawingMask}
                              onTouchMove={drawMask}
                              onTouchEnd={stopDrawingMask}
                              className={cn(
                                "absolute inset-0 w-full h-full object-contain z-10",
                                activeTool === 'highlight' ? "cursor-crosshair opacity-50" : "pointer-events-none opacity-0"
                              )}
                              style={{ 
                                mixBlendMode: 'screen',
                                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                              }}
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
                                    backgroundSize: `${40 / zoomLevel}px ${40 / zoomLevel}px`
                                  }}
                                />
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Perspective Controls Overlay */}
                          {activeTool === 'perspective' && (
                            <div className="absolute top-4 right-4 flex flex-col gap-2 z-30 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl w-48">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Perspective</div>
                                <button onClick={() => setRotation({ x: 0, y: 0 })} className="text-neutral-500 hover:text-white transition-colors">
                                  <RefreshCw size={12} />
                                </button>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                                    <span>TILT</span>
                                    <span>{rotation.x.toFixed(0)}°</span>
                                  </div>
                                  <input 
                                    type="range" min="-30" max="30" value={rotation.x}
                                    onChange={(e) => setRotation(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                                    <span>PAN</span>
                                    <span>{rotation.y.toFixed(0)}°</span>
                                  </div>
                                  <input 
                                    type="range" min="-30" max="30" value={rotation.y}
                                    onChange={(e) => setRotation(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-neutral-500 italic leading-tight">
                                Drag on the image to adjust perspective freely.
                              </div>
                            </div>
                          )}

                          {/* Walkthrough Controls */}
                          {images.length > 1 && (
                            <>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                                <Tooltip text="Previous Angle">
                                  <button 
                                    onClick={prevAngle}
                                    className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all border border-white/10"
                                  >
                                    <ChevronLeft size={24} />
                                  </button>
                                </Tooltip>
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                                <Tooltip text="Next Angle">
                                  <button 
                                    onClick={nextAngle}
                                    className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all border border-white/10"
                                  >
                                    <ChevronRight size={24} />
                                  </button>
                                </Tooltip>
                              </div>
                            </>
                          )}

                          {/* Scale Reference */}
                          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10 z-20">
                            GRID SCALE: 1 UNIT = 3 FT | ZOOM: {zoomLevel.toFixed(1)}x
                          </div>
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
                      <h2 className="text-2xl font-bold mb-2">Property Walkthrough</h2>
                      <p className="text-neutral-400">Upload multiple photos from different angles to create a virtual walkthrough of your property.</p>
                    </div>
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                      >
                        <Upload size={20} />
                        Upload Photos
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*"
                        multiple
                      />
                    </div>
                  </div>
                )}

                {/* Canvas Controls */}
                <div className="absolute bottom-6 left-6 flex gap-2 z-30">
                  <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                    <Tooltip text="Select Tool">
                      <button 
                        onClick={() => setActiveTool('select')}
                        className={cn(
                          "p-3 transition-all border-r border-neutral-700",
                          activeTool === 'select' ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        )}
                      >
                        <BoxSelect size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Hand Tool (Pan)">
                      <button 
                        onClick={() => setActiveTool('hand')}
                        className={cn(
                          "p-3 transition-all border-r border-neutral-700",
                          activeTool === 'hand' ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        )}
                      >
                        <Hand size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Crop Tool">
                      <button 
                        onClick={() => setActiveTool('crop')}
                        className={cn(
                          "p-3 transition-all border-r border-neutral-700",
                          activeTool === 'crop' ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        )}
                      >
                        <Crop size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Perspective Tool">
                      <button 
                        onClick={() => setActiveTool('perspective')}
                        className={cn(
                          "p-3 transition-all border-r border-neutral-700",
                          activeTool === 'perspective' ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        )}
                      >
                        <RotateCw size={20} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Highlight Focus Area">
                      <button 
                        onClick={() => setActiveTool('highlight')}
                        className={cn(
                          "p-3 transition-all",
                          activeTool === 'highlight' ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        )}
                      >
                        <PenTool size={20} />
                      </button>
                    </Tooltip>
                  </div>

                  {activeTool === 'highlight' && (
                    <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                      <Tooltip text="Clear Highlight">
                        <button 
                          onClick={clearMask}
                          className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                        >
                          <Eraser size={20} />
                        </button>
                      </Tooltip>
                    </div>
                  )}

                  <Tooltip text="Toggle measurement grid (1 unit = 3 ft)">
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
                  </Tooltip>
                  
                  {currentImage && (
                    <>
                      <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                        <Tooltip text="Zoom Out">
                          <button 
                            onClick={() => handleZoom(-0.2)}
                            className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-r border-neutral-700"
                          >
                            <ZoomOut size={20} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Reset View">
                          <button 
                            onClick={() => {
                              setZoomLevel(1);
                              setPanOffset({ x: 0, y: 0 });
                              setRotation({ x: 0, y: 0 });
                            }}
                            className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-r border-neutral-700"
                          >
                            <Maximize size={20} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Zoom In">
                          <button 
                            onClick={() => handleZoom(0.2)}
                            className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                          >
                            <ZoomIn size={20} />
                          </button>
                        </Tooltip>
                      </div>

                      <Tooltip text="Delete this angle">
                        <button 
                          onClick={() => {
                            if (!activeProjectId || !currentVersion) return;
                            const newImages = images.filter((_, i) => i !== activeIndex);
                            setProjects(prev => prev.map(p => p.id === activeProjectId ? {
                              ...p,
                              versions: p.versions.map(v => v.id === p.currentVersionId ? {
                                ...v,
                                images: newImages
                              } : v)
                            } : p));
                            if (activeIndex >= newImages.length) {
                              setActiveIndex(Math.max(0, newImages.length - 1));
                            }
                          }}
                          className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center gap-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              {/* Gallery Strip */}
              {images.length > 0 && (
                <div className="h-24 bg-neutral-900/80 border-t border-neutral-800 p-3 flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800">
                  <Tooltip text="Add new photo angle">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center text-neutral-500 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                    >
                      <Plus size={20} />
                      <span className="text-[8px] font-bold uppercase mt-1">Add</span>
                    </button>
                  </Tooltip>
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setActiveIndex(i);
                        setZoomLevel(1);
                      }}
                      className={cn(
                        "flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all relative group",
                        i === activeIndex ? "border-emerald-500 scale-105 shadow-lg shadow-emerald-900/20" : "border-neutral-800 hover:border-neutral-600"
                      )}
                    >
                      <img src={img.url} className="w-full h-full object-cover" alt={img.name} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white uppercase">{img.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>
                          {msg.content}
                        </Markdown>
                      </div>
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
                    <div className="absolute bottom-3 right-3">
                      <Tooltip text="Send message to AI assistant">
                        <button 
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isProcessing}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all"
                        >
                          <Send size={18} />
                        </button>
                      </Tooltip>
                    </div>
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
                      value={activeProject?.zipCode || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, zipCode: val } : p));
                      }}
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
                      <Tooltip text="Add a custom material item">
                        <button className="text-xs text-emerald-500 font-bold hover:text-emerald-400 flex items-center gap-1">
                          <Plus size={14} /> Add Custom
                        </button>
                      </Tooltip>
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
                        {currentVersion?.materials.map((m) => (
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
                            value={currentVersion?.laborRate || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setProjects(prev => prev.map(p => p.id === activeProjectId ? {
                                ...p,
                                versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, laborRate: val } : v)
                              } : p));
                            }}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-neutral-500 uppercase font-mono">Estimated Hours</label>
                        <input 
                          type="number" 
                          value={currentVersion?.laborHours || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setProjects(prev => prev.map(p => p.id === activeProjectId ? {
                              ...p,
                              versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, laborHours: val } : v)
                            } : p));
                          }}
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
                          <span className="font-mono">${(currentVersion?.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-100">Labor</span>
                          <span className="font-mono">${((currentVersion?.laborRate || 0) * (currentVersion?.laborHours || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/30">
                          <span className="text-emerald-100">Tax (Est. 8%)</span>
                          <span className="font-mono">${(calculateTotal() * 0.08).toLocaleString()}</span>
                        </div>
                      </div>

                      <Tooltip text="Export estimate as a PDF document">
                        <button className="w-full bg-white text-emerald-700 font-bold py-4 rounded-2xl mt-8 hover:bg-emerald-50 transition-all shadow-xl">
                          Generate Quote PDF
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Market Context</h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                        <p className="text-xs text-neutral-400 mb-1">Local Material Index ({activeProject?.zipCode || 'Global'})</p>
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
