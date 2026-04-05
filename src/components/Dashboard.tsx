import React from 'react';
import { FolderOpen, Clock, MapPin, ImageIcon, Plus } from 'lucide-react';
import { Project } from '../types';
import { cn } from '../lib/utils';
import { ANGLE_LABEL_DISPLAY } from '../types';

interface DashboardProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectClick: (id: string) => void;
  onCreateProject: () => void;
}

export function Dashboard({ projects, activeProjectId, onProjectClick, onCreateProject }: DashboardProps) {
  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-1">Project Dashboard</h2>
            <p className="text-neutral-400">Manage your landscaping projects and design versions.</p>
          </div>
          <button 
            onClick={onCreateProject}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

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
            {projects.map(project => {
              const currentVersion = project.versions.find(v => v.id === project.currentVersionId) || project.versions[0];
              const recentImage = currentVersion?.images?.[0];

              return (
                <div 
                  key={project.id}
                  className={cn(
                    "bg-neutral-900 border rounded-3xl overflow-hidden transition-all group cursor-pointer flex flex-col",
                    activeProjectId === project.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-neutral-800 hover:border-neutral-700"
                  )}
                  onClick={() => onProjectClick(project.id)}
                >
                  <div className="h-48 bg-neutral-800 relative overflow-hidden shrink-0">
                    {recentImage ? (
                      <img 
                        src={recentImage.url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={project.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <ImageIcon size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10 flex items-center gap-2">
                      <ImageIcon size={10} /> {currentVersion?.images?.length || 0}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="text-xl font-bold mb-1 truncate">{project.name}</h4>
                    <p className="text-xs text-neutral-500 mb-4 line-clamp-2 min-h-[32px]">{project.description || 'No description provided.'}</p>
                    <div className="mt-auto flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest pt-4 border-t border-neutral-800">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(project.updatedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5 truncate max-w-[50%] justify-end" title={project.address}><MapPin size={12} className="shrink-0" /> <span className="truncate">{project.address || project.zipCode || 'No Address'}</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
