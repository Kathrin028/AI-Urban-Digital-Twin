import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, AlertTriangle, Clock3, Copy } from "lucide-react";
import AdminLayout from "../components/admin/AdminLayout";
import { getComplaintById, updateComplaintStatus, getComplaints, assignComplaintToDepartment } from "../services/complaintService";
import { getDepartments } from "../services/departmentService";

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [relatedComplaints, setRelatedComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    getComplaintById(id).then(comp => {
      setComplaint(comp);
      if (comp.is_primary !== false) {
        getComplaints({ duplicate_of: id }).then(setRelatedComplaints).catch(console.error);
      }
    }).catch(console.error);

    getDepartments().then(setDepartments).catch(console.error);
  }, [id]);

  const handleAssignDepartment = async () => {
    if (!selectedDeptId) return;
    setIsAssigning(true);
    try {
      const updated = await assignComplaintToDepartment(id, selectedDeptId);
      setComplaint(updated);
      setSelectedDeptId("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to assign department");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await updateComplaintStatus(id, newStatus);
      setComplaint(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (!complaint) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500">
          <p>Complaint not found or loading...</p>
          <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 hover:underline">
            Back to Admin Dashboard
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        {/* IDENTIFICATION & STATUS BANNER */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-wrap gap-8 justify-between items-center">
          <div>
            <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-3">
              {complaint.category || "Complaint"}
              <span className="text-slate-500 font-mono text-[20px]">#{complaint.id?.substring(0,8).toUpperCase()}</span>
            </h1>
            <p className="text-[14px] font-medium text-slate-500 mt-2">
              Reported: {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "Unknown"}
              {complaint.updated_at && <span className="ml-4 border-l pl-4 border-slate-300">Last Updated: {new Date(complaint.updated_at).toLocaleString()}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Status</div>
              <div className={`text-[15px] font-bold flex items-center justify-center gap-1.5 ${
                complaint.status === 'Resolved' ? 'text-emerald-600' :
                complaint.status === 'In Progress' ? 'text-blue-600' :
                'text-amber-600'
              }`}>
                {complaint.status === 'Resolved' ? '🟢 ' : complaint.status === 'In Progress' ? '🔵 ' : '🟠 '}
                {complaint.status?.toUpperCase()}
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-center shadow-sm min-w-[160px]">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Department</div>
              <div className={`text-[14px] font-bold ${complaint.assigned_department_name ? 'text-indigo-600' : 'text-slate-500'}`}>
                {complaint.assigned_department_name || "Not Assigned"}
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS SUMMARY */}
        <div className="mb-10 bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock3 size={16} className="text-blue-600" />
            Current Progress
          </h3>
          <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
            {complaint.status === 'Resolved' && complaint.progress_notes?.length > 0
              ? `Resolved: ${complaint.progress_notes[complaint.progress_notes.length-1].note}`
              : complaint.status === 'Resolved'
              ? "Complaint has been successfully resolved."
              : complaint.status === 'In Progress' && complaint.progress_notes?.length > 0
              ? `In Progress: ${complaint.progress_notes[complaint.progress_notes.length-1].note}`
              : complaint.status === 'In Progress'
              ? "Field team is currently actively working on this issue."
              : complaint.assigned_department_name
              ? "Assigned to department and awaiting field work."
              : "Complaint submitted and pending department assignment."}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {complaint.is_primary !== false ? (
                <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-bold bg-indigo-100 text-indigo-700">
                  PRIMARY ISSUE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold bg-slate-100 text-slate-600">
                  <Copy size={14} /> DUPLICATE REPORT
                </span>
              )}
            </div>
            <p className="text-[13px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex gap-4">
              <span>User ID: {complaint.userId || "Unknown"}</span>
              {complaint.is_primary !== false && complaint.related_report_count > 1 && (
                <span className="text-indigo-600">Citizen Reports: {complaint.related_report_count}</span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6">
            <div className="flex flex-col items-end gap-2">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Update Status</span>
              <select
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-400 transition cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Assign Department</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm focus:border-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignDepartment}
                  disabled={!selectedDeptId || isAssigning}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                {complaint.description || "N/A"}
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3">Location</h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 font-medium shadow-inner">
                {complaint.location?.address ? (
                  <span>{complaint.location.address}</span>
                ) : complaint.location?.latitude ? (
                  <span className="font-mono text-[14px]">{complaint.location.latitude}, {complaint.location.longitude}</span>
                ) : (
                  "Location not provided"
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BrainCircuit className="text-indigo-600" size={16} />
                AI Analysis & Priority
              </h3>
              {complaint.aiPrediction ? (
                <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[14px] font-medium text-slate-600">Verification</span>
                    <span className={`text-[14px] font-bold ${complaint.evidence_verification_status === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {complaint.evidence_verification_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[14px] font-medium text-slate-600">Priority Level</span>
                    <span className={`text-[14px] font-bold flex items-center gap-1.5 ${complaint.priority === 'Critical' || complaint.priority === 'High' ? 'text-rose-600' : complaint.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      <AlertTriangle size={16} />
                      {complaint.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[14px] font-medium text-slate-600">Est. Resolution</span>
                    <span className="text-[14px] font-semibold flex items-center gap-2 text-indigo-700">
                      <Clock3 size={18} />
                      {complaint.estimated_resolution || "Not Available Yet"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[14px] font-medium text-slate-600">Total Reports</span>
                    <span className="text-[14px] font-semibold flex items-center gap-2 text-indigo-700">
                      <Copy size={18} />
                      {complaint.related_report_count || 1} Reports
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[14px] text-slate-500 font-medium p-4 text-center border border-dashed border-slate-200 rounded-xl">Not Available</div>
              )}
            </div>
            
            {relatedComplaints.length > 0 && complaint.is_primary !== false && (
              <div>
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Copy className="text-indigo-600" size={16} />
                  RELATED CITIZEN REPORTS
                </h3>
                <div className="space-y-3">
                  {relatedComplaints.map(related => (
                    <div key={related.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[14px] text-indigo-900">#{related.id.substring(0, 8)}</div>
                        <div className="text-[13px] text-indigo-700 font-medium">{related.category}</div>
                        <div className="text-[12px] text-indigo-600/80">
                          {related.created_at ? new Date(related.created_at).toLocaleString() : (related.date ? new Date(related.date).toLocaleString() : "Unknown")}
                        </div>
                      </div>
                      <Link
                        to={`/admin/complaints/${related.id}`}
                        className="px-4 py-2 bg-white border border-indigo-200 text-indigo-800 text-[13px] font-semibold rounded-xl hover:bg-indigo-100 transition whitespace-nowrap text-center"
                      >
                        View Report
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {complaint.is_duplicate && complaint.duplicate_of && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <h3 className="text-[16px] font-bold text-blue-900 mb-1">Similar Issue Already Reported</h3>
                  <p className="text-[14px] text-blue-700">This complaint has been linked to an existing primary issue.</p>
                </div>
                <Link 
                  to={`/admin/complaints/${complaint.duplicate_of}`}
                  className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-xl shadow-sm transition"
                >
                  View Primary Complaint
                </Link>
              </div>
            )}
            
          </div>

          {/* Right Column - Timeline */}
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-8">Status Timeline</h3>
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 pb-6">
              
              {/* Fallback timeline if status_history doesn't exist */}
              {!complaint.status_history && (
                <>
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-blue-600 ring-[6px] ring-white shadow-sm" />
                    <div className="pl-8">
                      <h4 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Complaint Submitted
                        {complaint.status === 'Pending' && (
                          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                            Latest Update
                          </span>
                        )}
                      </h4>
                      <p className="mt-1.5 text-[13px] font-medium text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : (complaint.date ? new Date(complaint.date).toLocaleString() : "Unknown")}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-[6px] ring-white shadow-sm transition-colors ${
                      complaint.status === 'In Progress' || complaint.status === 'Resolved' ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                    <div className="pl-8">
                      <h4 className={`text-[15px] font-bold tracking-tight flex items-center gap-3 ${
                        complaint.status === 'In Progress' || complaint.status === 'Resolved' ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        In Progress
                        {complaint.status === 'In Progress' && (
                          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                            Latest Update
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-[6px] ring-white shadow-sm transition-colors ${
                      complaint.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                    <div className="pl-8">
                      <h4 className={`text-[15px] font-bold tracking-tight flex items-center gap-3 ${
                        complaint.status === 'Resolved' ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        Resolved
                        {complaint.status === 'Resolved' && (
                          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                            Latest Update
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                </>
              )}

              {/* Dynamic timeline from status_history */}
              {complaint.status_history && (
                <>
                  {['Pending', 'In Progress', 'Resolved'].map((stageStatus) => {
                    const historyEntry = complaint.status_history.find(h => h.status === stageStatus);
                    
                    const isReached = !!historyEntry;
                    
                    let bgColor = 'bg-slate-200';
                    let textColor = 'text-slate-400';
                    
                    if (isReached) {
                      if (stageStatus === 'Resolved') {
                        bgColor = 'bg-emerald-500';
                        textColor = 'text-slate-900';
                      } else {
                        bgColor = 'bg-blue-600';
                        textColor = 'text-slate-900';
                      }
                    }

                    const displayTitle = stageStatus === 'Pending' ? 'Complaint Submitted' : stageStatus;

                    return (
                      <div className="relative" key={stageStatus}>
                        <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-[6px] ring-white shadow-sm transition-colors ${bgColor}`} />
                        <div className="pl-8">
                          <h4 className={`text-[15px] font-bold tracking-tight ${textColor} flex items-center gap-3`}>
                            {displayTitle}
                            {complaint.status === stageStatus && (
                              <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                                Latest Update
                              </span>
                            )}
                          </h4>
                          {isReached && historyEntry && (
                            <p className="mt-1.5 text-[13px] font-medium text-slate-500">
                              {new Date(historyEntry.changed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
