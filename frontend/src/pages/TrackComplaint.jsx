import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { getComplaintsByUser } from "../services/complaintService";

function TrackComplaint() {
  const { user } = useAuth();
  
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    if (user) {
      getComplaintsByUser().then(setComplaints).catch(console.error);
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">My Complaints</h1>
          <p className="mt-1.5 text-[15px] font-medium text-slate-500">Track and manage your submitted civic issues.</p>
        </div>
        <Link to="/report" className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 transition shadow-[0_2px_10px_rgba(15,23,42,0.1)] text-[15px]">
          Report New Issue
        </Link>
      </div>
      
      {complaints.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-h-[300px] flex flex-col items-center justify-center">
          <p className="text-slate-500 text-[15px] font-medium">You haven't reported any complaints yet.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50/80 px-8 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-5 md:col-span-4">Category</div>
            <div className="col-span-4 md:col-span-3">Date Reported</div>
            <div className="col-span-3 md:col-span-3">Status</div>
            <div className="hidden md:block md:col-span-2 text-right">Action</div>
          </div>
          <div className="divide-y divide-slate-100">
            {complaints.map(complaint => (
              <Link 
                key={complaint.id} 
                to={`/complaints/${complaint.id}`}
                className="grid grid-cols-12 gap-4 items-center px-8 py-5 transition hover:bg-blue-50/50 hover:shadow-inner"
              >
                <div className="col-span-5 md:col-span-4">
                  <h3 className="text-[15px] font-semibold text-slate-900">{complaint.category}</h3>
                  <p className="text-[13px] text-slate-500 truncate max-w-[240px] mt-1">
                    {complaint.location?.latitude ? `${complaint.location.latitude}, ${complaint.location.longitude}` : 'No location provided'}
                  </p>
                </div>
                <div className="col-span-4 md:col-span-3 text-[14px] font-medium text-slate-600">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-3 md:col-span-3">
                  <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-[13px] font-bold ${
                    complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                    complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
                <div className="hidden md:flex md:col-span-2 justify-end">
                  <span className="text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition">View Details &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TrackComplaint;