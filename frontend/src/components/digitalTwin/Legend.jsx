const Legend = () => {
  return (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 shadow-xl shadow-slate-900/5">
      <h4 className="text-[13px] font-bold text-slate-800 mb-3 tracking-wide">MAP KEY</h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm ring-1 ring-slate-900/5"></div>
          <span className="text-[13px] font-medium text-slate-600">High Priority</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#f97316] border-2 border-white shadow-sm ring-1 ring-slate-900/5"></div>
          <span className="text-[13px] font-medium text-slate-600">Medium Priority</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#10b981] border-2 border-white shadow-sm ring-1 ring-slate-900/5"></div>
          <span className="text-[13px] font-medium text-slate-600">Low Priority</span>
        </div>
        
        <div className="h-px bg-slate-200/60 my-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[#ef4444] opacity-40 border border-[#ef4444]"></div>
          <span className="text-[13px] font-medium text-slate-600">AI Hotspot</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 opacity-20 filter blur-[1px]"></div>
          <span className="text-[13px] font-medium text-slate-600">Density Heatmap</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;
