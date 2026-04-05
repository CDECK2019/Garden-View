import React, { useState, useCallback } from 'react';
import { Layout, FolderOpen, ImageIcon, Calculator, Download, Plus } from 'lucide-react';
import { cn } from './lib/utils';
import { usePersistedProjects } from './hooks/usePersistedProjects';
import { Project, ProjectVersion, DEFAULT_MATERIALS, ImageAngle, AngleLabel } from './types';
import { Tooltip } from './components/Tooltip';
import { Dashboard } from './components/Dashboard';
import { DesignStudio } from './components/DesignStudio';
import { BusinessManager } from './components/BusinessManager';
import { ChatPanel } from './components/ChatPanel';
import { NewProjectModal } from './components/NewProjectModal';
import { SaveVersionModal } from './components/SaveVersionModal';
import { PropertyWalkthrough } from './components/PropertyWalkthrough';
import { ProgressOverlay } from './components/ProgressOverlay';
import { 
  analyzePropertyContext, 
  editLandscapeImage, 
  editAllAngles, 
  chatWithPropertyContext 
} from './services/geminiService';

type ViewMode = 'dashboard' | 'design' | 'business';

export default function App() {
  const { projects, setProjects } = usePersistedProjects();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // UI State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  // Modals & Overlays
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSaveVersion, setShowSaveVersion] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  
  // Async State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressItems, setProgressItems] = useState<{id: string, name: string, status: any}[]>([]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const currentVersion = activeProject?.versions.find(v => v.id === activeProject.currentVersionId);
  const images = currentVersion?.images || [];

  const handleCreateProject = (data: { name: string; description: string; address: string; city: string; state: string; zipCode: string }) => {
    const newVersion: ProjectVersion = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Initial Version',
      timestamp: Date.now(),
      images: [],
      materials: [...DEFAULT_MATERIALS],
      laborRate: 65,
      laborHours: 0
    };
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
      versions: [newVersion],
      currentVersionId: newVersion.id,
      chatHistory: []
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setViewMode('design');
    setShowNewProject(false);
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

  const handleUpload = (files: FileList) => {
    if (!activeProjectId || !currentVersion) return;
    const newImagesPromises = Array.from(files).map((file, i) => {
      return new Promise<ImageAngle>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          id: Math.random().toString(36).substr(2, 9),
          url: e.target?.result as string,
          name: `Photo ${images.length + i + 1}`,
          label: 'custom',
          customLabelName: `Upload ${i+1}`,
          timestamp: Date.now()
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImagesPromises).then(newImages => {
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, images: [...v.images, ...newImages] } : v)
      } : p));
    });
  };

  const updateImage = (index: number, updates: Partial<ImageAngle>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      versions: p.versions.map(v => v.id === p.currentVersionId ? {
        ...v, images: v.images.map((img, i) => i === index ? { ...img, ...updates } : img)
      } : v)
    } : p));
  };

  const deleteImage = (index: number) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      versions: p.versions.map(v => v.id === p.currentVersionId ? {
        ...v, images: v.images.filter((_, i) => i !== index)
      } : v)
    } : p));
    if (activeIndex >= images.length - 1) setActiveIndex(Math.max(0, images.length - 2));
  };

  const handleAnalyzeProperty = async () => {
    if (!activeProject || !currentVersion || images.length === 0) return;
    setIsAnalyzing(true);
    try {
      const context = await analyzePropertyContext(images);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? {
        ...p,
        versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, propertyContext: context } : v)
      } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = async (msg: string, applyToAll: boolean) => {
    if (!activeProject || !currentVersion) return;
    
    // Add user message
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p, chatHistory: [...p.chatHistory, { role: 'user', content: msg, timestamp: Date.now() }]
    } : p));
    setIsProcessing(true);

    try {
      if (images.length === 0) {
        // Text chat only
        const res = await chatWithPropertyContext(msg, images, currentVersion.propertyContext);
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p, chatHistory: [...p.chatHistory, { role: 'ai', content: res, timestamp: Date.now() }]
        } : p));
      } else if (applyToAll) {
        // Edit all
        setProgressItems(images.map(img => ({ id: img.id, name: img.name, status: 'pending' })));
        const results = await editAllAngles(images, msg, currentVersion.propertyContext, (idx) => {
          setProgressItems(prev => prev.map((item, i) => i === idx ? { ...item, status: 'processing' } : i < idx ? { ...prev[i], status: 'done' } : item));
        });
        
        let aiMsg = "I've applied those changes to all perspectives.";
        const editedImages = images.map((img, i) => ({ ...img, url: results[i].imageUrl, id: Math.random().toString(36).substring(2, 9), name: `${img.name} (Edited)` }));

        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          chatHistory: [...p.chatHistory, { role: 'ai', content: aiMsg, timestamp: Date.now(), appliedToAngles: editedImages.map(i => i.id) }],
          versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, images: [...v.images, ...editedImages] } : v)
        } : p));
        setProgressItems([]);
      } else {
        // Edit active
        const targetImg = images[activeIndex];
        const result = await editLandscapeImage(targetImg.url, msg, currentVersion.propertyContext);
        const newEdit: ImageAngle = {
          ...targetImg,
          id: Math.random().toString(36).substring(2, 9),
          url: result.imageUrl,
          name: `${targetImg.name} (Edited)`
        };
        
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          chatHistory: [...p.chatHistory, { role: 'ai', content: result.text || "I've updated this view.", timestamp: Date.now(), appliedToAngles: [newEdit.id] }],
          versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, images: [...v.images, newEdit] } : v)
        } : p));
        setActiveIndex(images.length); // point to newly appended image
      }
    } catch (e) {
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p, chatHistory: [...p.chatHistory, { role: 'ai', content: "Sorry, I ran into an error processing that request.", timestamp: Date.now() }]
      } : p));
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotal = useCallback(() => {
    if (!currentVersion) return 0;
    const materialsTotal = currentVersion.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0);
    const laborTotal = currentVersion.laborRate * currentVersion.laborHours;
    return materialsTotal + laborTotal;
  }, [currentVersion]);

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md z-50 shrink-0">
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
          {(['dashboard', 'design', 'business'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              disabled={mode !== 'dashboard' && !activeProjectId}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 capitalize disabled:opacity-30 disabled:cursor-not-allowed",
                viewMode === mode ? "bg-emerald-600 text-white shadow-md" : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              {mode === 'dashboard' ? <FolderOpen size={18} /> : mode === 'design' ? <ImageIcon size={18} /> : <Calculator size={18} />}
              <span className="text-sm font-medium">{mode === 'business' ? 'Business Mgr' : mode}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-neutral-500 uppercase font-mono">Project Total</span>
            <span className="text-lg font-bold text-emerald-400">${calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === 'dashboard' && (
          <Dashboard
            projects={projects}
            activeProjectId={activeProjectId}
            onProjectClick={(id) => { setActiveProjectId(id); setViewMode('design'); }}
            onCreateProject={() => setShowNewProject(true)}
          />
        )}

        {viewMode === 'design' && activeProject && currentVersion && (
          <>
            <DesignStudio
              images={images}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onUpload={handleUpload}
              onUpdateImage={updateImage}
              onDeleteImage={deleteImage}
              onAnalyzeProperty={handleAnalyzeProperty}
              onWalkthrough={() => setShowWalkthrough(true)}
              isAnalyzing={isAnalyzing}
              propertyContext={currentVersion.propertyContext}
            />
            <div className="w-[400px] shrink-0 border-l border-neutral-800 bg-neutral-900 flex flex-col relative z-20">
              <ChatPanel
                isOpen={isChatOpen}
                messages={activeProject.chatHistory}
                isProcessing={isProcessing}
                onSendMessage={handleChatSend}
              />
            </div>
          </>
        )}

        {viewMode === 'business' && activeProject && currentVersion && (
          <BusinessManager
            activeProject={activeProject}
            currentVersion={currentVersion}
            calculateTotal={calculateTotal}
            updateZip={(zip) => setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, zipCode: zip } : p))}
            updateLabor={(rate, hours) => setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, laborRate: rate, laborHours: hours } : v) } : p))}
            updateMaterialQuantity={(id, q) => setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, versions: p.versions.map(v => v.id === p.currentVersionId ? { ...v, materials: v.materials.map(m => m.id === id ? { ...m, quantity: q } : m) } : v) } : p))}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />}
      {showSaveVersion && activeProject && <SaveVersionModal defaultName={`Version ${activeProject.versions.length + 1}`} onClose={() => setShowSaveVersion(false)} onSave={saveVersion} />}
      {showWalkthrough && <PropertyWalkthrough images={images} initialIndex={activeIndex} onClose={() => setShowWalkthrough(false)} onSelectIndex={setActiveIndex} />}
      {progressItems.length > 0 && <ProgressOverlay items={progressItems} title="Applying AI Edits Across Property" />}
    </div>
  );
}
