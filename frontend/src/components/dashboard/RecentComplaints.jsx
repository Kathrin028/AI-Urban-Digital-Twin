import {
  CheckCircle2,
  Clock3,
  Loader2,
  ClipboardList,
} from "lucide-react";

export default function RecentComplaints({ complaints = [] }) {
  const getStatus = (status) => {
    switch (status) {
      case "Resolved":
        return (
          <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            <CheckCircle2 size={16} />
            {status}
          </span>
        );
      case "Pending":
        return (
          <span className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
            <Clock3 size={16} />
            {status}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <Loader2 size={16} />
            {status}
          </span>
        );
    }
  };

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .slice(0, 3);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)] h-full min-h-[400px] flex flex-col">
      <h2 className="mb-6 text-[18px] font-semibold text-slate-900 tracking-tight">
        Recent Complaints
      </h2>

      {recentComplaints.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 min-h-[250px]">
          <ClipboardList size={32} className="mb-3 text-slate-400" />
          <p className="text-[15px] font-medium text-slate-600">No complaints reported yet.</p>
          <p className="text-[13px] text-slate-400 mt-1">When you report an issue, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentComplaints.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div>
                <h3 className="font-semibold text-slate-900 text-[15px]">
                  {item.category}
                </h3>
                <p className="mt-1 text-[13px] text-slate-500 max-w-[240px] truncate">
                  {item.location?.latitude ? `${item.location.latitude}, ${item.location.longitude}` : "Location not provided"}
                </p>
              </div>
              <div>
                {getStatus(item.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}