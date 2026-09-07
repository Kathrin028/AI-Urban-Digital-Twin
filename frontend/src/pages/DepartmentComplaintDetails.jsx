import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Clock3, UploadCloud, MessageSquare } from "lucide-react";
import DepartmentLayout from "../components/department/DepartmentLayout";
import { getComplaintById, updateComplaintStatus, addProgressNote, uploadFieldEvidence } from "../services/complaintService";
import { getImageUrl } from "../services/api";

export default function DepartmentComplaintDetails() {
  const { id } = useParams();
  
  const [complaint, setComplaint] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);


  const loadComplaint = () => {
    getComplaintById(id).then(comp => {
      setComplaint(comp);
    }).catch(err => {
      console.error(err);
      setError(err.message || "Failed to load complaint");
    });
  }

  useEffect(() => {
    loadComplaint();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const updated = await updateComplaintStatus(id, newStatus);
      setComplaint(updated);
      alert("Complaint status updated successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const updated = await addProgressNote(id, noteText);
      setComplaint(updated);
      setNoteText("");
      alert("Progress note added successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add progress note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const updated = await uploadFieldEvidence(id, file);
      setComplaint(updated);
      alert("Field evidence uploaded successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload evidence");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (error) {
    return (
      <DepartmentLayout>
        <div className="p-8 text-center text-rose-500 font-medium">{error}</div>
      </DepartmentLayout>
    );
  }

  if (!complaint) {
    return (
      <DepartmentLayout>
        <div className="p-8 text-center text-slate-500">
          <p>Loading...</p>
        </div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout>
      <div className="mb-6">
        <Link to="/department/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
          Back to Workspace
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">{complaint.category || "N/A"}</h1>
              <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-bold bg-blue-100 text-blue-700">
                {complaint.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-[15px] font-medium text-slate-500 mt-2">
              Reported on {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "Unknown"}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Update Status</span>
            <div className="flex items-center gap-2">
              <select
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-400 transition cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              {isUpdating && <span className="text-sm text-slate-500 font-medium">Updating...</span>}
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
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-[15px] text-slate-700 font-mono shadow-inner">
                {complaint.location?.address || "Address not available"}
                <br />
                <span className="text-[13px] text-slate-500 mt-1 block">
                  {complaint.location?.latitude ?? "N/A"}, {complaint.location?.longitude ?? "N/A"}
                </span>
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
            
            {/* Field Evidence Section */}
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                Field Work Evidence
                
                <div>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                  >
                    <UploadCloud size={14} />
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </h3>
              
              <div className="space-y-4">
                {(!complaint.field_evidence || complaint.field_evidence.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-[14px] text-slate-500">No field evidence uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {complaint.field_evidence.map((evidence, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        <img 
                          src={getImageUrl(evidence.file_url)} 
                          alt="Field Evidence" 
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-700 truncate">{evidence.uploaded_by_name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(evidence.uploaded_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-6 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="text-blue-600" size={18} />
                Priority Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                  <span className="text-[14px] font-medium text-slate-600">Priority Level</span>
                  <span className={`text-[14px] font-bold ${
                    complaint.priority === 'Critical' ? 'text-rose-700' :
                    complaint.priority === 'High' ? 'text-rose-600' :
                    complaint.priority === 'Medium' ? 'text-amber-500' :
                    'text-emerald-600'
                  }`}>
                    {complaint.priority || "Low"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-slate-600">Est. Resolution</span>
                  <span className="text-[14px] font-semibold flex items-center gap-2 text-indigo-700">
                    <Clock3 size={18} />
                    {complaint.estimated_resolution || "Not Available"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status/Timeline & Notes */}
          <div className="space-y-12">
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
                        <p className="mt-1.5 text-[13px] font-medium text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "Unknown"}</p>
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
            
            {/* Progress Notes Section */}
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-500" />
                Progress Notes
              </h3>
              
              <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  maxLength={1000}
                  placeholder="Write a progress update..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-[14px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[100px]"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[12px] font-medium text-slate-500">
                    Characters: {noteText.length} / 1000
                  </span>
                  <button 
                    onClick={handleAddNote}
                    disabled={isAddingNote || !noteText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isAddingNote ? "Adding..." : "Add Progress Note"}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {(!complaint.progress_notes || complaint.progress_notes.length === 0) ? (
                  <p className="text-[14px] text-slate-500 italic">No progress notes have been added yet.</p>
                ) : (
                  [...complaint.progress_notes].reverse().map((note, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{note.created_by_name}</p>
                          <p className="text-[11px] font-medium text-blue-600">{note.department}</p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[14px] text-slate-700 whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}
