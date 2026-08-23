import { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import AdminLayout from '../components/admin/AdminLayout';
import { useAuth } from '../hooks/useAuth';
import { getComplaints } from '../services/complaintService';
import { getHotspots } from '../services/adminService';
import CityMap from '../components/digitalTwin/CityMap';

export default function MapView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const Layout = isAdmin ? AdminLayout : DashboardLayout;

  const [allComplaints, setAllComplaints] = useState([]);
  const [adminHotspotsData, setAdminHotspotsData] = useState(null);

  useEffect(() => {
    // Fetch base datasets unconditionally for the Digital Twin
    getComplaints({ primary_only: true }).then(setAllComplaints).catch(console.error);
    
    if (isAdmin) {
      getHotspots().then(setAdminHotspotsData).catch(console.error);
    }
  }, [isAdmin]);

  // Standardize complaint coordinates exactly as requested by Digital Twin
  const standardizedComplaints = useMemo(() => {
    return allComplaints
      .filter(c => c.location && !isNaN(parseFloat(c.location.latitude)) && !isNaN(parseFloat(c.location.longitude)))
      .map(c => ({
        ...c,
        lat: parseFloat(c.location.latitude),
        lng: parseFloat(c.location.longitude),
        date: c.date || c.created_at || new Date().toISOString()
      }));
  }, [allComplaints]);

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? "Urban Digital Twin" : "Complaint Explorer"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? "Real-time AI visualization and spatial clustering layer." : "Interactive map of civic complaints in your area."}
            </p>
          </div>
        </div>
        
        <div className="relative flex-1 min-h-[700px] rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.12)] z-0 bg-slate-50 border border-slate-200">
          <CityMap 
            complaints={standardizedComplaints} 
            hotspots={adminHotspotsData} 
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </Layout>
  );
}