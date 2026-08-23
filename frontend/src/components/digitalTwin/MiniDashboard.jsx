import { useMemo } from 'react';
import { Activity, AlertTriangle, Target, Clock } from 'lucide-react';

const MiniDashboard = ({ complaints, hotspots }) => {
  const stats = useMemo(() => {
    let totalComplaints = complaints.length;
    let totalHotspots = hotspots ? hotspots.length : 0;
    
    let totalConf = 0;
    let confCount = 0;
    let highestPri = 'Low';
    let highestPriScore = 1;

    complaints.forEach(c => {
      // Priority
      let pScore = 2; // Medium
      const p = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority || 'Unknown';
      if (p === 'High') pScore = 3;
      if (p === 'Low') pScore = 1;
      
      if (pScore > highestPriScore) {
        highestPriScore = pScore;
        highestPri = p;
      }

      // Confidence
      const conf = c.aiPrediction?.confidence || c.ai_prediction?.confidence;
      if (conf) {
        totalConf += parseFloat(conf);
        confCount += 1;
      }
    });

    let avgConf = confCount > 0 ? (totalConf / confCount * 100).toFixed(1) + '%' : 'N/A';
    
    // Formatting date (Last update logic)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      totalComplaints,
      totalHotspots,
      avgConf,
      highestPri: totalComplaints > 0 ? highestPri : 'None',
      lastUpdated: timeString
    };
  }, [complaints, hotspots]);

  return (
    <div className="absolute top-20 right-6 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-2xl shadow-slate-900/10 min-w-[260px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          MINI DASHBOARD
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1" title="Last Updated">
          <Clock size={10} /> {stats.lastUpdated}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Complaints</p>
          <p className="text-2xl font-bold text-slate-800">{stats.totalComplaints}</p>
        </div>
        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Hotspots</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalHotspots}</p>
        </div>
      </div>

      <div className="h-px bg-slate-200/60 my-4"></div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1.5">
            <Target size={14} className="text-slate-400" /> AI Confidence
          </p>
          <p className="text-[14px] font-bold text-slate-800">{stats.avgConf}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-slate-400" /> Max Priority
          </p>
          <p className={`text-[14px] font-bold ${
            stats.highestPri === 'High' ? 'text-rose-600' : 
            stats.highestPri === 'Medium' ? 'text-amber-600' : 
            stats.highestPri === 'Low' ? 'text-emerald-600' : 'text-slate-800'
          }`}>
            {stats.highestPri}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiniDashboard;
