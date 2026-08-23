import { useMemo } from "react";
import { BrainCircuit, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { generateDashboardSuggestions } from "../../services/dashboardSuggestionService";

export default function AISuggestions({ complaints = [] }) {
  const suggestions = useMemo(() => {
    return generateDashboardSuggestions(complaints);
  }, [complaints]);

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] h-full min-h-[400px] flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl bg-blue-100 p-2.5 text-blue-600">
          <BrainCircuit size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">
          AI Insights
        </h2>
      </div>

      <div className="space-y-4 flex-1">
        {suggestions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center min-h-[250px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <BrainCircuit size={32} className="mb-3 text-blue-300" />
            <p className="text-[15px] font-medium text-slate-600 mb-1">No insights available</p>
            <p className="text-[13px] text-slate-500">Report an issue to see AI predictions.</p>
          </div>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm transition-all hover:border-blue-100"
            >
              <div className="shrink-0 mt-0.5">
                {item.type === 'warning' && <AlertCircle className="text-amber-500" size={20} />}
                {item.type === 'critical' && <AlertCircle className="text-red-500" size={20} />}
                {item.type === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                {item.type === 'info' && <Info className="text-blue-500" size={20} />}
              </div>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">
                {item.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}