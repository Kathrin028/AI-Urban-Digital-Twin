import {
  BrainCircuit,
  AlertTriangle,
  Clock3,
} from "lucide-react";

export default function AISummary({ aiData }) {
  if (!aiData) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="rounded-2xl bg-white p-5 mb-5 shadow-sm border border-slate-100">
          <BrainCircuit className="text-blue-300" size={36} />
        </div>
        <h2 className="text-[18px] font-semibold text-slate-700 mb-1">Waiting for Input</h2>
        <p className="text-[14px] text-slate-500 max-w-[240px] leading-relaxed">
          Select a category or upload an image to view the AI analysis preview.
        </p>
      </div>
    );
  }

  if (aiData.error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center shadow-sm">
        <AlertTriangle className="text-red-500 mb-4" size={36} />
        <h2 className="text-[18px] font-semibold text-red-900 mb-2">AI Analysis Failed</h2>
        <p className="text-[14px] text-red-700">{aiData.message}</p>
      </div>
    );
  }

  if (aiData.unsupported) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center shadow-sm">
        <BrainCircuit className="text-amber-500 mb-4" size={36} />
        <h2 className="text-[18px] font-semibold text-amber-900 mb-2">AI Verification Unavailable</h2>
        <p className="text-[14px] text-amber-800">{aiData.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] h-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">
            AI Analysis
          </h2>
          <p className="text-[12px] font-semibold text-blue-600 uppercase tracking-wider mt-0.5">
            Prediction Preview
          </p>
        </div>
      </div>

      {/* Prediction */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-white p-5 border border-blue-50 shadow-sm transition-all hover:border-blue-100">
          <span className="text-[14px] font-medium text-slate-600">
            Detected Category
          </span>
          <span className="text-[14px] font-semibold text-blue-600">
            {aiData.detectedCategory}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white p-5 border border-blue-50 shadow-sm transition-all hover:border-blue-100">
          <span className="text-[14px] font-medium text-slate-600">
            Confidence
          </span>
          <span className="text-[13px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">
            {typeof aiData.confidence === 'number' ? `${(aiData.confidence * 100).toFixed(0)}%` : aiData.confidence}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white p-5 border border-blue-50 shadow-sm transition-all hover:border-blue-100">
          <span className="text-[14px] font-medium text-slate-600">
            Priority
          </span>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-rose-600">
            <AlertTriangle size={18} />
            {aiData.priority}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white p-5 border border-blue-50 shadow-sm transition-all hover:border-blue-100">
          <span className="text-[14px] font-medium text-slate-600">
            Est. Resolution
          </span>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-amber-600">
            <Clock3 size={18} />
            {aiData.estimatedResolution}
          </div>
        </div>
      </div>
    </div>
  );
}