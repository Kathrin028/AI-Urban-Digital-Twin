import { useState } from 'react';
import { Layers, Settings2 } from 'lucide-react';

const LayerControls = ({ config, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-6 left-6 z-[1000]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Layer Controls"
        title="Map Layers"
        className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200/50 shadow-lg hover:bg-white transition"
      >
        <Layers size={20} className="text-slate-700" />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 shadow-xl shadow-slate-900/10 min-w-[200px] flex flex-col gap-3">
          <h4 className="text-[13px] font-bold text-slate-800 tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <Settings2 size={16} /> MAP LAYERS
          </h4>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={config.showComplaints} 
              onChange={() => onToggle('showComplaints')} 
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
              aria-label="Toggle Complaints Layer"
            />
            <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition">Complaints Layer</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={config.showHotspots} 
              onChange={() => onToggle('showHotspots')} 
              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" 
              aria-label="Toggle Hotspots Layer"
            />
            <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition">AI Hotspots</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={config.showHeatmap} 
              onChange={() => onToggle('showHeatmap')} 
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer" 
              aria-label="Toggle Density Heatmap"
            />
            <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition">Density Heatmap</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-slate-100">
            <input 
              type="checkbox" 
              checked={config.showDashboard} 
              onChange={() => onToggle('showDashboard')} 
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
              aria-label="Toggle Mini Dashboard"
            />
            <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition">Mini Dashboard</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default LayerControls;
