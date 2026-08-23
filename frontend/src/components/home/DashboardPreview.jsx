import { Activity, Clock3, CheckCircle2, AlertTriangle, BrainCircuit } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Cell,
  PieChart as RePieChart,
  Pie,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  ResponsiveContainer as ReResponsiveContainer,
} from "recharts";


export default function DashboardPreview() {
  // Dummy data for charts
  const barData = [
    { name: "Jan", complaints: 400 },
    { name: "Feb", complaints: 300 },
    { name: "Mar", complaints: 200 },
    { name: "Apr", complaints: 278 },
    { name: "May", complaints: 189 },
    { name: "Jun", complaints: 239 },
    { name: "Jul", complaints: 349 },
  ];

  const lineData = [
    { month: "Jan", resolved: 240 },
    { month: "Feb", resolved: 139 },
    { month: "Mar", resolved: 980 },
    { month: "Apr", resolved: 390 },
    { month: "May", resolved: 530 },
    { month: "Jun", resolved: 430 },
    { month: "Jul", resolved: 210 },
  ];

  const pieData = [
    { name: "Low", value: 400 },
    { name: "Medium", value: 300 },
    { name: "High", value: 300 },
    { name: "Critical", value: 200 },
  ];

  const recentComplaints = [
    { id: 1, title: "Pothole on Main St.", location: "Downtown", category: "Infrastructure", status: "Pending", priority: "High" },
    { id: 2, title: "Illegal dumping", location: "West Side", category: "Environment", status: "In Progress", priority: "Medium" },
    { id: 3, title: "Broken streetlight", location: "East End", category: "Safety", status: "Resolved", priority: "Low" },
    { id: 4, title: "Graffiti removal", location: "North Park", category: "Maintenance", status: "Pending", priority: "Low" },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-200">
            Dashboard
          </span>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
            Smart Municipality Command Center
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Real-time AI-driven view of civic complaints, analytics and operational insights.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Complaints" value="2,546" icon={<Activity className="text-indigo-600" size={24} />} />
          <StatCard title="Pending" value="324" icon={<Clock3 className="text-orange-500" size={24} />} />
          <StatCard title="Resolved" value="2,118" icon={<CheckCircle2 className="text-green-600" size={24} />} />
          <StatCard title="High Priority" value="104" icon={<AlertTriangle className="text-red-600" size={24} />} />
        </div>

        {/* Main content */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[2fr_1fr]">
          {/* Left column – Charts */}
          <div className="grid gap-8">
            {/* Bar Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Complaints Over Time</h3>
              <ReResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ReTooltip />
                  <Bar dataKey="complaints" fill="#2563EB" />
                </BarChart>
              </ReResponsiveContainer>
            </div>
            {/* Line Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Resolution Trend</h3>
              <ReResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <ReTooltip />
                  <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ReResponsiveContainer>
            </div>
            {/* Pie Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Priority Distribution</h3>
              <ReResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#60a5fa", "#fbbf24", "#ef4444", "#10b981"][index % 4]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <ReLegend />
                </RePieChart>
              </ReResponsiveContainer>
            </div>
          </div>

          {/* Right column – AI Insights & Heatmap */}
          <div className="grid gap-8">
            {/* AI Insights */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">AI Insights</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <BrainCircuit className="text-indigo-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">AI Prediction</p>
                    <p className="text-xs text-slate-500">85% chance of resolution within 48 h</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <AlertTriangle className="text-red-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Hotspot Alert</p>
                    <p className="text-xs text-slate-500">Two zones exceed complaint threshold</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Resolution Rate</p>
                    <p className="text-xs text-slate-500">96% of complaints resolved last month</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Heatmap Preview */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Heatmap Preview</h3>
              <div className="relative h-48 rounded-lg bg-gradient-to-r from-indigo-100 via-white to-indigo-100">
                {/* Simple placeholder grid to simulate heat intensity */}
                <div className="grid grid-cols-5 gap-1 h-full p-1">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full rounded ${i % 4 === 0 ? "bg-indigo-300" : "bg-indigo-100"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="mt-12">
          <h3 className="mb-4 text-2xl font-semibold text-slate-900">Recent Complaints</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Complaint</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Location</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Category</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm text-slate-800">{c.title}</td>
                    <td className="px-4 py-2 text-sm text-slate-800">{c.location}</td>
                    <td className="px-4 py-2 text-sm text-slate-800">{c.category}</td>
                    <td className="px-4 py-2 text-sm text-slate-800">{c.status}</td>
                    <td className="px-4 py-2 text-sm text-slate-800">{c.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className="rounded-full bg-white p-2.5 shadow-sm border border-slate-100">
        {icon}
      </div>
    </div>
  );
}