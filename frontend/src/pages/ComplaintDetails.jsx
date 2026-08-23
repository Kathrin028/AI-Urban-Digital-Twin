import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, AlertTriangle, Clock3, CheckCircle2, Copy } from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { getComplaintById, getComplaints } from "../services/complaintService";
import { getImageUrl } from "../services/api";

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => {
    getComplaintById(id).then(data => {
      setComplaint(data);
      if (data.is_primary) {
        getComplaints({ duplicate_of: id }).then(setDuplicates).catch(console.error);
      }
    }).catch(console.error);
  }, [id]);

  if (!complaint) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">
          <p>Complaint not found or loading...</p>
          <button onClick={() => navigate('/my-complaints')} className="mt-4 text-blue-600 hover:underline">
            Go back to My Complaints
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/my-complaints" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
          Back to My Complaints
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">{complaint.category}</h1>
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
            {complaint.is_primary !== false && complaint.related_report_count > 1 && (
              <p className="text-[14px] font-bold text-indigo-600 mt-1">
                Citizen Reports: {complaint.related_report_count}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center rounded-lg px-4 py-2 text-[14px] font-bold ${
            complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
            complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {complaint.status}
          </span>
        </div>

        {complaint.is_duplicate && complaint.duplicate_of && (
          <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-[16px] font-bold text-blue-900 mb-1">Similar Issue Already Reported</h3>
              <p className="text-[14px] text-blue-700">This complaint has been linked to an existing primary issue in your area.</p>
            </div>
            <Link 
              to={`/complaints/${complaint.duplicate_of}`}
              className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-xl shadow-sm transition"
            >
              View Primary Complaint
            </Link>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3">Description</h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                {complaint.description || "No description provided."}
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3">Location</h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 font-mono shadow-inner">
                {complaint.location?.latitude ? `${complaint.location.latitude}, ${complaint.location.longitude}` : "Location not provided"}
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
            
            {(complaint.evidence_verification_status === "VERIFIED") && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="font-semibold text-emerald-900 flex items-center gap-2 mb-1">
                    Evidence Verified
                  </div>
                  <p className="text-[14px] text-emerald-800">
                    The uploaded image matches the reported category.
                  </p>
                </div>
              </div>
            )}
            
            {(complaint.evidence_verification_status === "INSUFFICIENT_VISUAL_EVIDENCE") && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <div className="font-semibold text-orange-900 flex items-center gap-2 mb-1">
                    Needs Review
                  </div>
                  <p className="text-[14px] text-orange-800">
                    The uploaded image does not provide sufficient visual evidence for the reported category.
                  </p>
                </div>
              </div>
            )}
            
            {(complaint.evidence_verification_status === "CATEGORY_MISMATCH") && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <div className="font-semibold text-orange-900 flex items-center gap-2 mb-1">
                    Needs Review
                  </div>
                  <p className="text-[14px] text-orange-800">
                    The uploaded image may not match the reported category.
                  </p>
                </div>
              </div>
            )}
            
            {(complaint.evidence_verification_status === "UNVERIFIED") && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BrainCircuit className="text-slate-400" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                    AI Verification Unavailable
                  </div>
                  <p className="text-[14px] text-slate-600">
                    {((complaint.ai_prediction || complaint.aiPrediction) && (complaint.ai_prediction || complaint.aiPrediction).reason) || "Automatic image verification is not currently available for this category."}
                  </p>
                </div>
              </div>
            )}
            
            {(complaint.evidence_verification_status === "ANALYSIS_FAILED") && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="font-semibold text-red-900 flex items-center gap-2 mb-1">
                    Analysis Failed
                  </div>
                  <p className="text-[14px] text-red-800">
                    {((complaint.ai_prediction || complaint.aiPrediction) && (complaint.ai_prediction || complaint.aiPrediction).reason) || "AI analysis failed. The complaint was submitted, but image verification could not be completed."}
                  </p>
                </div>
              </div>
            )}
            
            {(!complaint.evidence_verification_status || complaint.evidence_verification_status === "NOT_ANALYZED") && complaint.imageName && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-slate-400" size={18} />
                  Evidence Verification
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                    Not Analyzed
                  </div>
                  <p className="text-[14px] text-slate-600">
                    The image was not analyzed.
                  </p>
                </div>
              </div>
            )}
            
            {(complaint.ai_prediction || complaint.aiPrediction) && (complaint.ai_prediction || complaint.aiPrediction).available && (
              <div>
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BrainCircuit className="text-blue-600" size={18} />
                  AI Analysis
                </h3>
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 space-y-4 shadow-sm">
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
                      (complaint.ai_prediction || complaint.aiPrediction).priority === 'High' ? 'text-red-600' :
                      (complaint.ai_prediction || complaint.aiPrediction).priority === 'Medium' ? 'text-orange-500' :
                      (complaint.ai_prediction || complaint.aiPrediction).priority === 'Low' ? 'text-green-600' :
                      'text-slate-400'
                    }`}>
                      <AlertTriangle size={18} />
                      {(complaint.ai_prediction || complaint.aiPrediction).priority || "Not Available Yet"}
                      {(complaint.ai_prediction || complaint.aiPrediction).priority_confidence && (
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
                    <span className="text-[14px] font-semibold flex items-center gap-2 text-slate-400">
                      <Clock3 size={18} />
                      Not Available Yet
                    </span>
                  </div>
                </div>
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
                      {complaint.status === 'In Progress' && (
                        <p className="mt-1.5 text-[14px] text-slate-500 leading-relaxed">The city is currently working on this issue.</p>
                      )}
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
                      {complaint.status === 'Resolved' && (
                        <p className="mt-1.5 text-[14px] text-slate-500 leading-relaxed">The issue has been successfully resolved.</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Dynamic timeline from status_history */}
              {complaint.status_history && (
                <>
                  {['Pending', 'In Progress', 'Resolved'].map((stageStatus) => {
                    const historyEntry = complaint.status_history.find(h => h.status === stageStatus);
                    
                    // A stage is active if we have a history entry for it, OR if it's the current status
                    // Wait, history will have all transitions. We only show the latest timestamp for each.
                    
                    // Simplified logic: If historyEntry exists, it's reached.
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

        {complaint.is_primary !== false && duplicates.length > 0 && (
          <div className="mt-12 pt-10 border-t border-slate-100">
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight mb-6">RELATED CITIZEN REPORTS</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {duplicates.map(dup => (
                <div key={dup.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[13px] font-mono font-medium text-slate-500">#{dup.id.substring(0, 8)}...</span>
                    <span className="text-[12px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Duplicate</span>
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-800 mb-1">{dup.category}</h4>
                  <p className="text-[13px] text-slate-500 mb-4 line-clamp-2">{dup.description || "No description"}</p>
                  <p className="text-[12px] font-medium text-slate-400 mb-4">
                    {dup.created_at ? new Date(dup.created_at).toLocaleString() : (dup.date ? new Date(dup.date).toLocaleString() : "Unknown")}
                  </p>
                  <Link 
                    to={`/complaints/${dup.id}`}
                    className="inline-flex items-center text-[13px] font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    View Report &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
