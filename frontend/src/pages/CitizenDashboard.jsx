import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import StatCard from "../components/dashboard/StatCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentComplaints from "../components/dashboard/RecentComplaints";
import AISuggestions from "../components/dashboard/AISuggestion";
import { getComplaintsByUser } from "../services/complaintService";

export default function CitizenDashboard() {
  const { user } = useAuth();
  
  const [userComplaints, setUserComplaints] = useState([]);
  
  useEffect(() => {
    if (user) {
      getComplaintsByUser().then(setUserComplaints).catch(console.error);
    }
  }, [user]);

  const { stats, complaints } = useMemo(() => {
    return {
      stats: {
        total: userComplaints.length,
        pending: userComplaints.filter(c => c.status === 'Pending').length,
        resolved: userComplaints.filter(c => c.status === 'Resolved').length,
        highPriority: userComplaints.filter(c => c.aiPrediction?.priority === 'High' || c.priority === 'High').length || 0,
      },
      complaints: userComplaints,
    };
  }, [userComplaints]);

  return (
    <DashboardLayout>

      {/* Welcome Banner */}
      <WelcomeBanner name={user?.name || "Citizen"} />

      {/* Statistics */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        <StatCard
          title="Total Complaints"
          value={stats.total.toString()}
          icon={<ClipboardList size={28} />}
          colorClass="text-blue-600 bg-blue-50"
        />

        <StatCard
          title="Pending"
          value={stats.pending.toString()}
          icon={<Clock3 size={28} />}
          colorClass="text-amber-600 bg-amber-50"
        />

        <StatCard
          title="Resolved"
          value={stats.resolved.toString()}
          icon={<CheckCircle2 size={28} />}
          colorClass="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          title="High Priority"
          value={stats.highPriority.toString()}
          icon={<AlertTriangle size={28} />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </section>

      {/* Quick Actions */}
      <section className="mt-10">
        <QuickActions />
      </section>

      {/* Bottom Section */}
      <section className="mt-10 grid gap-8 lg:grid-cols-[65fr_35fr]">
        <RecentComplaints complaints={complaints} />
        <AISuggestions complaints={complaints} />
      </section>

    </DashboardLayout>
  );
}