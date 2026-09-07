import { useState, useEffect, useCallback } from "react";
import DepartmentLayout from "../components/department/DepartmentLayout";
import ComplaintTable from "../components/admin/ComplaintTable";
import { getComplaints } from "../services/complaintService";
import { useAuth } from "../hooks/useAuth";
import StatCard from "../components/dashboard/StatCard";

export default function DepartmentDashboard() {
  const { user } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState('');

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getComplaints({
        status: statusFilter,
        primary_only: true
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load assigned complaints.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, [refreshData]);

  // Derived stats
  const totalAssigned = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <DepartmentLayout>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Department Workspace</h1>
        <p className="text-[15px] font-medium text-slate-500">
          Welcome back, {user?.name}. You are viewing complaints assigned to <span className="font-bold text-slate-700">{user?.department}</span>.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Assigned"
          value={totalAssigned.toString()}
          trend="+0%"
          trendUp={true}
        />
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          trend="+0%"
          trendUp={false}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount.toString()}
          trend="+0%"
          trendUp={true}
        />
        <StatCard
          title="Resolved"
          value={resolvedCount.toString()}
          trend="+0%"
          trendUp={true}
        />
      </section>

      {/* Workspace Area */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">Assigned Complaints</h2>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-[180px] h-11 border border-slate-300 rounded-xl px-4 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white hover:border-slate-400"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white min-h-[400px]">
          {loading ? (
            <div className="p-16 text-center text-slate-500 font-medium">Loading assigned complaints...</div>
          ) : error ? (
            <div className="p-16 text-center text-rose-500 font-medium">{error}</div>
          ) : complaints.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-medium">No complaints are currently assigned to your department.</div>
          ) : (
            <ComplaintTable 
              complaints={complaints} 
              onStatusChange={refreshData}
              basePath="/department/complaints"
            />
          )}
        </div>
      </section>
    </DepartmentLayout>
  );
}
