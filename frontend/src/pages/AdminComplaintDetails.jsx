import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, AlertTriangle, Clock3, CheckCircle2 } from "lucide-react";
import AdminLayout from "../components/admin/AdminLayout";
import { getComplaintById, updateComplaintStatus, getComplaints } from "../services/complaintService";
import { getImageUrl } from "../services/api";
import { Copy } from "lucide-react";

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [relatedComplaints, setRelatedComplaints] = useState([]);

  useEffect(() => {
    getComplaintById(id).then(comp => {
      setComplaint(comp);
      if (comp.is_primary !== false) {
        getComplaints({ duplicate_of: id }).then(setRelatedComplaints).catch(console.error);
      }
    }).catch(console.error);
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus);
      setComplaint({ ...complaint, status: newStatus });
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
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">{complaint.category || "N/A"}</h1>
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
            <p className="text-[15px] font-medium text-slate-500 mt-2">
              Reported on {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : (complaint.date ? new Date(complaint.date).toLocaleString() : "Unknown")}
            </p>
            <p className="text-[13px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex gap-4">
              <span>User ID: {complaint.userId || "Unknown"}</span>
              {complaint.is_primary !== false && complaint.related_report_count > 1 && (
                <span className="text-indigo-600">Citizen Reports: {complaint.related_report_count}</span>
              )}
            </p>
          </div>
          
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
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 font-mono shadow-inner">
                {complaint.location?.latitude ?? "N/A"}, {complaint.location?.longitude ?? "N/A"}
              </div>
            </div>
            
            {(complaint.image_url || complaint.imageName) && (
              <div>
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3">Attached Evidence</h3>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-2 overflow-hidden shadow-inner flex items-center justify-center min-h-[200px]">
                  {complaint.image_url ? (
                    <img 
                      src={getImageUrl(complaint.image_url)} 
                      alt="Complaint Evidence" 
                      className="max-h-[400px] w-full object-contain rounded-xl"
                    />
                  ) : (
                    <span className="text-[15px] text-slate-700 font-medium p-4">{complaint.imageName}</span>
                  )}
                </div>
              </div>
            )}
            
            {complaint.recommended_action && (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h3 className="text-[13px] font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-lg">🤖</span> AI-Assisted Recommended Action
                </h3>
                <div className="mb-3">
                  <span className={`inline-flex font-bold text-[15px] uppercase tracking-wider ${
                    complaint.recommended_action.severity === 'high' ? 'text-rose-600' :
                    complaint.recommended_action.severity === 'medium' ? 'text-amber-600' :
                    complaint.recommended_action.severity === 'low' ? 'text-emerald-600' :
                    complaint.recommended_action.severity === 'resolved' ? 'text-blue-600' :
                    'text-slate-500'
                  }`}>
                    {complaint.recommended_action.action}
                  </span>
                </div>
                <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                  {complaint.recommended_action.reason}
                </p>
              </div>
            )}
            
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BrainCircuit className="text-blue-600" size={18} />
                Evidence Verification
              </h3>
              <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-3">
                {complaint.evidence_verification_status === "VERIFIED" && <div className="text-emerald-600 mt-0.5"><CheckCircle2 size={20} /></div>}
                {complaint.evidence_verification_status === "INSUFFICIENT_VISUAL_EVIDENCE" && <div className="text-amber-500 mt-0.5"><AlertTriangle size={20} /></div>}
                {complaint.evidence_verification_status === "CATEGORY_MISMATCH" && <div className="text-orange-500 mt-0.5"><AlertTriangle size={20} /></div>}
                {(!complaint.evidence_verification_status || complaint.evidence_verification_status === "NOT_ANALYZED") && <div className="text-slate-400 mt-0.5"><AlertTriangle size={20} /></div>}
                
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {complaint.evidence_verification_status === "VERIFIED" && "🟢 Evidence Verified"}
                    {complaint.evidence_verification_status === "INSUFFICIENT_VISUAL_EVIDENCE" && "🟡 Needs Verification"}
                    {complaint.evidence_verification_status === "CATEGORY_MISMATCH" && "🟠 Needs Verification"}
                    {(!complaint.evidence_verification_status || complaint.evidence_verification_status === "NOT_ANALYZED") && "⚪ Not Analyzed"}
                  </div>
                  <div className="text-[13px] text-slate-600 mt-1">
                    {complaint.evidence_verification_status === "INSUFFICIENT_VISUAL_EVIDENCE" && "Insufficient Visual Evidence"}
                    {complaint.evidence_verification_status === "CATEGORY_MISMATCH" && "Image/Category Mismatch"}
                  </div>
                  <div className="text-[12px] text-slate-400 mt-2 italic">
                    AI-assisted evidence verification. Final verification remains with the City Official.
                  </div>
                </div>
              </div>

              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BrainCircuit className="text-blue-600" size={18} />
                AI Analysis
              </h3>
              {complaint.ai_prediction || complaint.aiPrediction ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Detected Category</span>
                    <span className="text-[14px] font-semibold text-blue-700">
                      {(complaint.ai_prediction || complaint.aiPrediction).category || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Confidence</span>
                    <span className="text-[13px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                      {(complaint.ai_prediction || complaint.aiPrediction).confidence ? `${((complaint.ai_prediction || complaint.aiPrediction).confidence * 100).toFixed(0)}%` : "0%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Model</span>
                    <span className="text-[14px] font-semibold text-slate-700">
                      {(complaint.ai_prediction || complaint.aiPrediction).model_name || "YOLOv8"} v{(complaint.ai_prediction || complaint.aiPrediction).model_version || "1.0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Inference Time</span>
                    <span className="text-[14px] font-semibold text-slate-700">
                      {(complaint.ai_prediction || complaint.aiPrediction).inference_time_ms ? `${(complaint.ai_prediction || complaint.aiPrediction).inference_time_ms} ms` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Analysis Time</span>
                    <span className="text-[14px] font-semibold text-slate-700">
                      {(complaint.ai_prediction || complaint.aiPrediction).analyzed_at ? new Date((complaint.ai_prediction || complaint.aiPrediction).analyzed_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                    <span className="text-[14px] font-medium text-slate-600">Priority</span>
                    <span className={`text-[14px] font-semibold flex items-center gap-2 ${
                      (complaint.priority || (complaint.ai_prediction || complaint.aiPrediction)?.priority) === 'Critical' ? 'text-rose-700' :
                      (complaint.priority || (complaint.ai_prediction || complaint.aiPrediction)?.priority) === 'High' ? 'text-rose-600' :
                      (complaint.priority || (complaint.ai_prediction || complaint.aiPrediction)?.priority) === 'Medium' ? 'text-amber-500' :
                      (complaint.priority || (complaint.ai_prediction || complaint.aiPrediction)?.priority) === 'Low' ? 'text-emerald-600' :
                      'text-slate-400'
                    }`}>
                      <AlertTriangle size={18} />
                      {(complaint.priority || (complaint.ai_prediction || complaint.aiPrediction)?.priority) || "Not Available Yet"}
                      {(complaint.ai_prediction || complaint.aiPrediction)?.priority_confidence && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">
                          {((complaint.ai_prediction || complaint.aiPrediction).priority_confidence * 100).toFixed(0)}% conf
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {(complaint.ai_prediction || complaint.aiPrediction).priority_factors?.length > 0 && (
                    <div className="pt-2 pb-3 border-b border-blue-50">
                      <span className="text-[14px] font-medium text-slate-600 block mb-3">Priority Factors</span>
                      <ul className="space-y-2">
                        {(complaint.ai_prediction || complaint.aiPrediction).priority_factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
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
                      <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">Complaint Submitted</h4>
                      <p className="mt-1.5 text-[13px] font-medium text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : (complaint.date ? new Date(complaint.date).toLocaleString() : "Unknown")}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-[6px] ring-white shadow-sm transition-colors ${
                      complaint.status === 'In Progress' || complaint.status === 'Resolved' ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                    <div className="pl-8">
                      <h4 className={`text-[15px] font-bold tracking-tight ${
                        complaint.status === 'In Progress' || complaint.status === 'Resolved' ? 'text-slate-900' : 'text-slate-400'
                      }`}>In Progress</h4>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-[6px] ring-white shadow-sm transition-colors ${
                      complaint.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                    <div className="pl-8">
                      <h4 className={`text-[15px] font-bold tracking-tight ${
                        complaint.status === 'Resolved' ? 'text-slate-900' : 'text-slate-400'
                      }`}>Resolved</h4>
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
                          <h4 className={`text-[15px] font-bold tracking-tight ${textColor}`}>{displayTitle}</h4>
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
