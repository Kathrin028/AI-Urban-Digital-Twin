import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { updateComplaintStatus } from "../../services/complaintService";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";

export default function ComplaintTable({ complaints, onStatusChange, basePath = "/admin/complaints" }) {
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const handleStatusChange = (id, newStatus) => {
    updateComplaintStatus(id, newStatus)
      .then(() => {
        addNotification('success', `Status updated to ${newStatus}`);
        onStatusChange();
      })
      .catch(err => {
        addNotification('error', `Failed to update status: ${err.message}`);
      });
  };

  if (!complaints || complaints.length === 0) {
    return (
      <div className="p-16 text-center min-h-[300px] flex items-center justify-center">
        <p className="text-slate-500 text-[15px] font-medium">No complaints match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-[14px] text-slate-600">
        <thead className="bg-slate-50/80 text-slate-500 border-y border-slate-200">
          <tr>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Issue Cluster</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Location / Description</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Reports</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Priority & Resolution</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">AI Verification</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px]">Status</th>
            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[12px] text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {complaints.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-8 py-5">
                <div className="font-bold text-indigo-900 mb-1 uppercase tracking-tight text-[13px]">{c.category.toUpperCase()} ISSUE CLUSTER</div>
                <div className="text-[12px] text-slate-500 font-semibold"><span className="text-slate-700">Complaint #{c.id.substring(0, 8).toUpperCase()}</span></div>
                <div className="text-[11px] text-slate-400 mt-1">Reported: {c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A"}</div>
              </td>
              <td className="px-8 py-5 max-w-[240px]">
                <div className="font-semibold text-slate-800 text-[13px] truncate">{c.location?.address || "Unknown Location"}</div>
                <div className="text-[12px] text-slate-500 truncate mt-1" title={c.description}>{c.description || "N/A"}</div>
              </td>
              <td className="px-8 py-5">
                <div className="font-bold text-slate-900">Total: {c.related_report_count || 1}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">Duplicates: {(c.related_report_count || 1) - 1}</div>
              </td>
              <td className="px-8 py-5">
                <div className={`font-bold text-[13px] ${c.priority === 'Critical' || c.priority === 'High' ? 'text-rose-600' : c.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                   {c.priority || "Low"}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">EST: {c.estimated_resolution || "5-7 Days"}</div>
              </td>
              <td className="px-8 py-5">
                  <div className="font-bold text-[12px]">
                    {c.evidence_verification_status === 'VERIFIED' ? <span className="text-emerald-600">Verified</span> : 
                     c.evidence_verification_status === 'UNVERIFIED' ? <span className="text-rose-600">Unverified</span> : 
                     c.evidence_verification_status === 'NOT_ANALYZED' ? <span className="text-slate-400">Not Analyzed</span> :
                     <span className="text-slate-500">{c.evidence_verification_status ? String(c.evidence_verification_status).replace('_', ' ') : 'Pending'}</span>}
                  </div>
                {c.aiPrediction?.confidence ? (
                  <div className="text-[11px] font-medium text-slate-500 mt-1">Conf: {typeof c.aiPrediction.confidence === 'number' ? `${(c.aiPrediction.confidence * 100).toFixed(0)}%` : c.aiPrediction.confidence}</div>
                ) : null}
              </td>
              <td className="px-8 py-5 whitespace-nowrap">
                <StatusBadge status={c.status} />
                {c.updated_at && <div className="mt-1 text-[11px] font-medium text-slate-500">Updated: {new Date(c.updated_at).toLocaleDateString()}</div>}
                <div className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${c.assigned_department ? 'text-blue-600' : 'text-slate-400'}`}>
                  {c.assigned_department_name || (c.assigned_department ? (user?.role === 'department' ? user.department : "Assigned") : "Unassigned")}
                </div>
              </td>
              <td className="px-8 py-5 whitespace-nowrap flex items-center justify-end gap-3 h-[88px]">
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id, e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-400 cursor-pointer shadow-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <Link
                  to={`${basePath}/${c.id}`}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[12px] font-bold rounded-lg hover:bg-indigo-100 transition whitespace-nowrap"
                >
                  View Issue &rarr;
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
