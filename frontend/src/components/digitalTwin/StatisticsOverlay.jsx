import { useMemo } from 'react';
import { Layers, Activity, AlertTriangle, Target } from 'lucide-react';

const StatisticsOverlay = ({ complaints, hotspots }) => {
  const stats = useMemo(() => {
    let totalComplaints = complaints.length;
    let totalHotspots = hotspots.length;
    
    let totalPriorityScore = 0;
    let catCounts = {};
    let totalConf = 0;
    let confCount = 0;

    complaints.forEach(c => {
      // Average Priority
      let pScore = 2; // Medium
      const p = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority;
      if (p === 'High') pScore = 3;
      if (p === 'Low') pScore = 1;
      totalPriorityScore += pScore;

      // Category
      const cat = c.category || 'Unknown';
      catCounts[cat] = (catCounts[cat] || 0) + 1;

      // Confidence
      const conf = c.aiPrediction?.confidence || c.ai_prediction?.confidence;
      if (conf) {
        totalConf += parseFloat(conf);
        confCount += 1;
      }
    });

    let avgPScore = totalComplaints > 0 ? totalPriorityScore / totalComplaints : 0;
    let avgPriStr = 'None';
    if (avgPScore >= 2.5) avgPriStr = 'High';
    else if (avgPScore >= 1.5) avgPriStr = 'Medium';
    else if (totalComplaints > 0) avgPriStr = 'Low';

    let domCat = 'N/A';
    let maxC = 0;
    for (let cat in catCounts) {
      if (catCounts[cat] > maxC) {
        maxC = catCounts[cat];
        domCat = cat;
      }
    }

    let avgConf = confCount > 0 ? (totalConf / confCount * 100).toFixed(1) + '%' : 'N/A';

    return {
      totalComplaints,
      totalHotspots,
      avgPriStr,
      domCat,
      avgConf
    };
  }, [complaints, hotspots]);

  return (
    <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-2xl shadow-slate-900/10 min-w-[260px]">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
        <Activity size={16} className="text-blue-500" />
        LIVE VIEWPORT STATS
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Complaints</p>
          <p className="text-xl font-bold text-slate-800">{stats.totalComplaints}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Hotspots</p>
          <p className="text-xl font-bold text-indigo-600">{stats.totalHotspots}</p>
        </div>
      </div>

      <div className="h-px bg-slate-200/60 my-4"></div>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Avg Priority
          </p>
          <p className={`text-[14px] font-bold ${
            stats.avgPriStr === 'High' ? 'text-rose-600' : 
            stats.avgPriStr === 'Medium' ? 'text-amber-600' : 
            stats.avgPriStr === 'Low' ? 'text-emerald-600' : 'text-slate-800'
          }`}>
            {stats.avgPriStr}
          </p>
        </div>
        
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers size={12} /> Dominant Issue
          </p>
          <p className="text-[14px] font-bold text-slate-800 truncate" title={stats.domCat}>{stats.domCat}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Target size={12} /> AI Confidence
          </p>
          <p className="text-[14px] font-bold text-slate-800">{stats.avgConf}</p>
        </div>
      </div>
    </div>
  );
};

export default StatisticsOverlay;
