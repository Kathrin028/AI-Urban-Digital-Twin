import { useState, useEffect, useCallback } from "react";
import { 
  ClipboardList, Clock3, CheckCircle2, AlertTriangle, 
  Activity, MapPinned, Flame, BrainCircuit, Target, Star
} from "lucide-react";
import AdminLayout from "../components/admin/AdminLayout";
import StatCard from "../components/dashboard/StatCard";
import ComplaintTable from "../components/admin/ComplaintTable";
import { getComplaints } from "../services/complaintService";
import { getAnalytics } from "../services/adminService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { exportComplaintsToCSV, exportComplaintsToPDF, exportAnalyticsToPDF } from '../utils/exportUtils';
import { Download, FileText } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const PRIORITY_COLORS = { "Low": "#10b981", "Medium": "#f59e0b", "High": "#ef4444" };
const STATUS_COLORS = { "Pending": "#f59e0b", "In Progress": "#3b82f6", "Resolved": "#10b981" };

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const data = await getComplaints({
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        primary_only: true
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    // Analytics is not filtered by search terms, it is a global snapshot
    getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshData();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [refreshData]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">Smart AI Analytics Dashboard</h1>
          <p className="mt-1.5 text-[15px] font-medium text-slate-500">Real-time K-Means clustering and Random Forest prediction metrics.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {analytics && (
            <div className="text-[12px] font-medium text-slate-400 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center">
              Cache Age: {analytics.cache_age_seconds}s
            </div>
          )}
          <button
            onClick={() => exportComplaintsToCSV(complaints)}
            className="text-[12px] font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            aria-label="Export CSV"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => exportComplaintsToPDF(complaints)}
            className="text-[12px] font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            aria-label="Export Complaints PDF"
          >
            <FileText size={14} /> Complaints PDF
          </button>
          <button
            onClick={() => exportAnalyticsToPDF(analytics?.summary)}
            className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            aria-label="Export Analytics PDF"
          >
            <FileText size={14} /> Analytics PDF
          </button>
        </div>
      </div>

      {analytics && (
        <>
          {/* AI Summary Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-8">
            <StatCard
              title="Citizen Reports"
              value={analytics.summary.citizen_reports_count.toString()}
              icon={<ClipboardList size={24} />}
              colorClass="text-slate-700 bg-slate-100"
            />
            <StatCard
              title="Active Issues"
              value={analytics.summary.total_complaints.toString()}
              icon={<ClipboardList size={24} />}
              colorClass="text-slate-700 bg-slate-100"
            />
            <StatCard
              title="Primary Issues"
              value={analytics.summary.total_complaints.toString()}
              icon={<ClipboardList size={24} />}
              colorClass="text-blue-700 bg-blue-100"
            />
            <StatCard
              title="Duplicate Reports"
              value={analytics.summary.duplicate_reports_count.toString()}
              icon={<ClipboardList size={24} />}
              colorClass="text-slate-500 bg-slate-200"
            />
            <StatCard
              title="Resolved %"
              value={analytics.summary.resolved_percentage + "%"}
              icon={<CheckCircle2 size={24} />}
              colorClass="text-emerald-600 bg-emerald-50"
            />
            <StatCard
              title="Avg Resolution"
              value={analytics.summary.average_resolution_time + " days"}
              icon={<Clock3 size={24} />}
              colorClass="text-blue-600 bg-blue-50"
            />
            <StatCard
              title="High Priority"
              value={analytics.summary.high_priority_count.toString()}
              icon={<AlertTriangle size={24} />}
              colorClass="text-rose-600 bg-rose-50"
            />
            <StatCard
              title="YOLO Detections"
              value={analytics.ai_summary.yolo_detections.toString()}
              icon={<BrainCircuit size={24} />}
              colorClass="text-purple-600 bg-purple-50"
            />
            <StatCard
              title="Avg Confidence"
              value={(analytics.ai_summary.average_detection_confidence * 100).toFixed(0) + "%"}
              icon={<Target size={24} />}
              colorClass="text-indigo-600 bg-indigo-50"
            />
            <StatCard
              title="Predicted Priority"
              value={analytics.ai_summary.average_predicted_priority}
              icon={<Star size={24} />}
              colorClass="text-amber-600 bg-amber-50"
            />
            <StatCard
              title="Total Hotspots"
              value={analytics.hotspots.total_hotspots.toString()}
              icon={<Activity size={24} />}
              colorClass="text-cyan-600 bg-cyan-50"
            />
            <StatCard
              title="Largest Hotspot"
              value={analytics.hotspots.largest_hotspot.toString()}
              icon={<MapPinned size={24} />}
              colorClass="text-orange-600 bg-orange-50"
            />
            <StatCard
              title="Hotspot Severity"
              value={analytics.hotspots.highest_priority_hotspot}
              icon={<Flame size={24} />}
              colorClass="text-red-600 bg-red-50"
            />
          </section>

          {/* Charts Section */}
          <section className="grid gap-6 lg:grid-cols-2 mb-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Category Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.charts.category_distribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Daily Complaint Trend</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.charts.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Priority Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.charts.priority_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.charts.priority_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Status Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.charts.status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.charts.status_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      )}

      {analytics && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] mb-8">
          <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <MapPinned className="text-indigo-600" size={20} />
            Area-wise Civic Analytics
          </h2>
          
          {!analytics.area_analytics || analytics.area_analytics.length === 0 ? (
            <div className="text-[14px] text-slate-500 font-medium p-8 text-center border border-dashed border-slate-200 rounded-xl">
              No geographic complaint data available.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              {/* Chart */}
              <div className="border border-slate-100 rounded-2xl p-4 shadow-sm bg-slate-50/30">
                <h3 className="text-[13px] font-bold text-slate-700 mb-4 text-center uppercase tracking-wider">Area Complaint Distribution</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.area_analytics.map(a => ({ name: a.area_name || `Area ${a.area_id}`, count: a.total_complaints }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px'}} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wider text-slate-500 font-semibold bg-slate-50/50">
                      <th className="p-4 rounded-tl-xl">Area</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">High</th>
                      <th className="p-4">Resolved</th>
                      <th className="p-4">Resolve %</th>
                      <th className="p-4 rounded-tr-xl">Category</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-slate-700 font-medium divide-y divide-slate-100">
                    {analytics.area_analytics.map((area, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <span className="font-semibold text-slate-900 block">{area.area_name || `Area ${area.area_id}`}</span>
                          <span className="text-[12px] text-slate-500 font-mono">{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}</span>
                        </td>
                        <td className="p-4 font-semibold">{area.total_complaints}</td>
                        <td className="p-4">
                          <span className={area.high_priority > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                            {area.high_priority}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-600 font-semibold">{area.resolved}</td>
                        <td className="p-4">
                          <span className={area.resolution_percentage >= 70 ? "text-emerald-600 font-bold" : area.resolution_percentage >= 40 ? "text-amber-600 font-bold" : "text-rose-600 font-bold"}>
                            {area.resolution_percentage}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-slate-100 text-slate-700">
                            {area.dominant_category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {analytics && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] mb-8">
          <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <Activity className="text-indigo-600" size={20} />
            Hotspot Trend Analysis
          </h2>
          
          {!analytics.hotspot_trend_analysis || analytics.hotspot_trend_analysis.length === 0 ? (
            <div className="text-[14px] text-slate-500 font-medium p-8 text-center border border-dashed border-slate-200 rounded-xl">
              No sufficient historical data available for hotspot comparison.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              {/* Chart */}
              <div className="border border-slate-100 rounded-2xl p-4 shadow-sm bg-slate-50/30 flex flex-col justify-center">
                <h3 className="text-[13px] font-bold text-slate-700 mb-4 text-center uppercase tracking-wider">Previous vs Current Period</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hotspot_trend_analysis}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="area_id" tickFormatter={(val) => {
                        const area = analytics.area_analytics?.find(a => a.area_id === val);
                        return area?.area_name || `Area ${val}`;
                      }} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px'}} />
                      <Legend wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey="previous_complaints" name="Previous" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="current_complaints" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wider text-slate-500 font-semibold bg-slate-50/50">
                      <th className="p-4 rounded-tl-xl">Area</th>
                      <th className="p-4">Current</th>
                      <th className="p-4">Previous</th>
                      <th className="p-4">Change</th>
                      <th className="p-4 rounded-tr-xl">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-slate-700 font-medium divide-y divide-slate-100">
                    {analytics.hotspot_trend_analysis.map((trend, idx) => {
                       let trendColor = "text-slate-600 bg-slate-100";
                       if (trend.trend === "IMPROVING") trendColor = "text-emerald-700 bg-emerald-100";
                       else if (trend.trend === "WORSENING") trendColor = "text-rose-700 bg-rose-100";
                       else if (trend.trend === "STABLE") trendColor = "text-amber-700 bg-amber-100";
                       
                       return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-semibold text-slate-900">
                            {(() => {
                              const area = analytics.area_analytics?.find(a => a.area_id === trend.area_id);
                              return area?.area_name || `Area ${trend.area_id}`;
                            })()}
                          </td>
                          <td className="p-4 font-semibold">{trend.current_complaints}</td>
                          <td className="p-4 text-slate-500">{trend.previous_complaints}</td>
                          <td className="p-4">
                            <span className={trend.complaint_change > 0 ? "text-rose-600 font-bold" : trend.complaint_change < 0 ? "text-emerald-600 font-bold" : "text-slate-500 font-medium"}>
                              {trend.complaint_change > 0 ? "+" : ""}{trend.complaint_change_percentage}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wide ${trendColor}`}>
                              {trend.trend}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Combined Management Section */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">Complaint Management</h2>
            <button 
              onClick={clearFilters}
              className="text-[14px] font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="grid gap-5 md:grid-cols-4">
            <div>
              <label className="block text-[14px] font-medium text-slate-700 mb-2">Search</label>
              <input 
                type="text" 
                placeholder="Search ID, User, Category..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition hover:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-slate-700 mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white hover:border-slate-400"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-slate-700 mb-2">Category</label>
              <select 
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white hover:border-slate-400"
              >
                <option value="">All Categories</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Drainage">Drainage</option>
              </select>
            </div>
            <div>
              <label className="block text-[14px] font-medium text-slate-700 mb-2">Priority</label>
              <select 
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full h-12 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white hover:border-slate-400"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white">
          <ComplaintTable 
            complaints={complaints} 
            onStatusChange={() => {
              refreshData();
              getAnalytics().then(setAnalytics).catch(console.error);
            }}
          />
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;