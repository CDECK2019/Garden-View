import React from 'react';
import { Calculator, ImageIcon, Plus, Layout, MapPin, DollarSign, Download } from 'lucide-react';
import { Project, ProjectVersion, Material } from '../types';
import { Tooltip } from './Tooltip';

interface BusinessManagerProps {
  activeProject: Project;
  currentVersion: ProjectVersion;
  updateMaterialQuantity: (id: string, quantity: number) => void;
  updateLabor: (rate: number, hours: number) => void;
  updateZip: (zip: string) => void;
  calculateTotal: () => number;
}

export function BusinessManager({
  activeProject,
  currentVersion,
  updateMaterialQuantity,
  updateLabor,
  updateZip,
  calculateTotal
}: BusinessManagerProps) {

  const materialsTotal = currentVersion.materials.reduce((sum, m) => sum + (m.unitPrice * m.quantity), 0);
  const laborTotal = currentVersion.laborRate * currentVersion.laborHours;
  const grandTotal = calculateTotal();

  const handlePrint = () => {
    window.print();
  };

  return (
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
                value={activeProject.zipCode || ''}
                onChange={(e) => updateZip(e.target.value)}
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
                      <th className="px-6 py-3">Material</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Unit Price</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {currentVersion.materials.map((m) => (
                      <tr key={m.id} className="group hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm">{m.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">Per {m.unit}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-400 capitalize">{m.category || 'Other'}</td>
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
                      value={currentVersion.laborRate || 0}
                      onChange={(e) => updateLabor(parseFloat(e.target.value) || 0, currentVersion.laborHours)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase font-mono">Estimated Hours</label>
                  <input 
                    type="number" 
                    value={currentVersion.laborHours || 0}
                    onChange={(e) => updateLabor(currentVersion.laborRate, parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="space-y-6">
            <div className="bg-emerald-600 rounded-3xl p-8 shadow-2xl shadow-emerald-900/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-emerald-100 font-mono text-xs uppercase tracking-widest mb-2">Project Estimate</h3>
                <div className="text-5xl font-bold mb-6">${grandTotal.toLocaleString()}</div>
                
                <div className="space-y-3 border-t border-emerald-500/50 pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-100">Materials</span>
                    <span className="font-mono">${materialsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-100">Labor</span>
                    <span className="font-mono">${laborTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/30">
                    <span className="text-emerald-100">Tax (Est. 8%)</span>
                    <span className="font-mono">${(grandTotal * 0.08).toLocaleString()}</span>
                  </div>
                </div>

                <Tooltip text="Export estimate as a PDF document">
                  <button onClick={handlePrint} className="w-full bg-white text-emerald-700 font-bold py-4 rounded-2xl mt-8 hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-2">
                    <Download size={18} />
                    Generate Quote PDF
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Market Context</h4>
              <div className="space-y-4">
                <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                  <p className="text-xs text-neutral-400 mb-1">Local Material Index ({activeProject.zipCode || 'Global'})</p>
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
  );
}
