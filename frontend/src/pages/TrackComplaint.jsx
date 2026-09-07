import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, X, ClipboardList } from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { getComplaintsByUser } from "../services/complaintService";

function TrackComplaint() {
  const { user } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (user) {
      getComplaintsByUser()
        .then(setComplaints)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  // Derived unique categories
  const categories = useMemo(() => {
    const cats = new Set(complaints.map(c => c.category).filter(Boolean));
    return ["All Categories", ...Array.from(cats)];
  }, [complaints]);

  // Filter and Sort Logic
  const filteredComplaints = useMemo(() => {
    let result = complaints;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace('complaint #', '').replace('#', '').trim();
      result = result.filter(c => {
        const idMatch = c.id?.toLowerCase().includes(q);
        const catMatch = c.category?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const locMatch = c.location?.address?.toLowerCase().includes(q) || 
                         (c.location?.latitude && String(c.location.latitude).includes(q));
        return idMatch || catMatch || descMatch || locMatch;
      });
    }

    // Category Filter
    if (selectedCategory !== "All Categories") {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Status Filter
    if (selectedStatus !== "All") {
      result = result.filter(c => c.status === selectedStatus);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.created_at || a.date).getTime() || 0;
      const dateB = new Date(b.created_at || b.date).getTime() || 0;
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [complaints, searchQuery, selectedCategory, selectedStatus, sortOrder]);

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: filteredComplaints.length,
      pending: filteredComplaints.filter(c => c.status === 'Pending').length,
      inProgress: filteredComplaints.filter(c => c.status === 'In Progress').length,
      resolved: filteredComplaints.filter(c => c.status === 'Resolved').length,
    };
  }, [filteredComplaints]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedStatus("All");
    setSortOrder("newest");
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">My Complaints</h1>
          <p className="mt-1.5 text-[15px] font-medium text-slate-500">Track and manage your submitted civic issues.</p>
        </div>
        <Link to="/report" className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 transition shadow-[0_2px_10px_rgba(15,23,42,0.1)] text-[15px] whitespace-nowrap">
          Report New Issue
        </Link>
      </div>
      
      {/* Filters & Search Area */}
      {complaints.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search complaints (ID, category, description)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm cursor-pointer min-w-[160px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm cursor-pointer min-w-[130px]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm cursor-pointer min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
          
          {/* Summary Counts */}
          <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 px-2">
              <ClipboardList size={16} className="text-slate-400" />
              <span>Total: <strong className="text-slate-900">{stats.total}</strong></span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Pending: <strong className="text-slate-900">{stats.pending}</strong></span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>In Progress: <strong className="text-slate-900">{stats.inProgress}</strong></span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Resolved: <strong className="text-slate-900">{stats.resolved}</strong></span>
            </div>
            
            {(searchQuery || selectedCategory !== "All Categories" || selectedStatus !== "All") && (
              <button 
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition"
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-h-[300px] flex flex-col items-center justify-center">
          <p className="text-slate-500 text-[15px] font-medium animate-pulse">Loading your complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-[18px] font-bold text-slate-900 mb-2">No Complaints Yet</h3>
          <p className="text-slate-500 text-[15px] font-medium max-w-sm mb-6">You haven't reported any civic issues yet. Click the button above to report a new issue.</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Search size={28} />
          </div>
          <h3 className="text-[18px] font-bold text-slate-900 mb-2">No results found</h3>
          <p className="text-slate-500 text-[15px] font-medium mb-6">We couldn't find any complaints matching your current filters.</p>
          <button 
            onClick={clearFilters}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
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
            {filteredComplaints.map(complaint => (
              <Link 
                key={complaint.id} 
                to={`/complaints/${complaint.id}`}
                className="grid grid-cols-12 gap-4 items-center px-8 py-5 transition hover:bg-blue-50/50 hover:shadow-inner group"
              >
                <div className="col-span-5 md:col-span-4">
                  <h3 className="text-[15px] font-semibold text-slate-900">{complaint.category}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-mono font-bold text-slate-500">Complaint #{complaint.id?.substring(0,8).toUpperCase()}</span>
                    <p className="text-[13px] text-slate-500 truncate max-w-[180px]">
                      {complaint.location?.latitude ? `${complaint.location.latitude}, ${complaint.location.longitude}` : (complaint.description || 'No description')}
                    </p>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-3 text-[14px] font-medium text-slate-600">
                  <div>Reported: {new Date(complaint.created_at || complaint.date).toLocaleDateString()}</div>
                  {complaint.updated_at && <div className="text-[12px] text-slate-400 mt-1">Updated: {new Date(complaint.updated_at).toLocaleDateString()}</div>}
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
                  <span className="text-[14px] font-semibold text-blue-600 group-hover:text-blue-700 transition">View Progress &rarr;</span>
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