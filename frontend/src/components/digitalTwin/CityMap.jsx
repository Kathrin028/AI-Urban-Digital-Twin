import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Search, Filter, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import ComplaintLayer from './ComplaintLayer';
import HotspotLayer from './HotspotLayer';
import Legend from './Legend';

// Fit map view to visible points
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    let allPoints = [];
    if (points && points.length > 0) {
      points.forEach(p => {
        if (!isNaN(p.lat) && !isNaN(p.lng)) allPoints.push([p.lat, p.lng]);
      });
    }

    if (allPoints.length === 0) {
      map.setView([11.0168, 76.9558], 12);
      return;
    }
    const bounds = L.latLngBounds(allPoints);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
}

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const CityMap = ({ complaints, hotspots, isAdmin, basePath }) => {
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter State
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');

  // Derive available categories dynamically
  const availableCategories = useMemo(() => {
    if (!complaints) return [];
    const cats = new Set(complaints.map(c => c.category).filter(Boolean));
    return ['All Categories', ...Array.from(cats)].sort();
  }, [complaints]);

  // Memoized Filtered Complaints
  const visibleComplaints = useMemo(() => {
    if (!complaints) return [];

    return complaints.filter(c => {
      // Filters
      if (status !== 'All' && c.status !== status) return false;
      if (category !== 'All Categories' && c.category !== category) return false;
      
      const p = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority;
      if (priority !== 'All' && p !== priority) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().replace('complaint #', '').replace('#', '').trim();
        const matchId = c.id && c.id.toLowerCase().includes(query);
        const matchCat = c.category && c.category.toLowerCase().includes(query);
        const matchStatus = c.status && c.status.toLowerCase().includes(query);
        const matchDesc = c.description && c.description.toLowerCase().includes(query);
        const matchAddr = c.location?.address && c.location.address.toLowerCase().includes(query);
        if (!matchId && !matchCat && !matchStatus && !matchDesc && !matchAddr) return false;
      }

      return true;
    });
  }, [complaints, status, category, priority, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: visibleComplaints.length,
      active: visibleComplaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length,
      resolved: visibleComplaints.filter(c => c.status === 'Resolved').length
    };
  }, [visibleComplaints]);

  const clearFilters = () => {
    setCategory('All Categories');
    setStatus('All');
    setPriority('All');
    setSearchQuery('');
    setShowFilters(false);
  };

  const hasActiveFilters = category !== 'All Categories' || status !== 'All' || priority !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Top Bar - Search & Filter */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start">
        {/* Empty space for potential left controls */}
        <div></div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold shadow-sm transition ${hasActiveFilters ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Filter size={16} />
              Filter {hasActiveFilters && 'Active'}
            </button>
            
            {/* Filter Dropdown Panel */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200 p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-[15px]">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="All">All</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                    <select 
                      value={priority} 
                      onChange={e => setPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="All">All</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  
                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="w-full mt-2 py-2 text-[13px] font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State Overlay */}
      {visibleComplaints.length === 0 && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-sm">
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">No complaints found</h3>
            <p className="text-slate-500 text-[14px] mb-6">There are no complaints matching your current filters in this area.</p>
            <button 
              onClick={clearFilters}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold text-[14px] rounded-xl hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[11.0168, 76.9558]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <ZoomControl position="bottomleft" />
          <MapFixer />
          <FitBounds points={visibleComplaints} />
          
          {isAdmin && hotspots && <HotspotLayer hotspots={hotspots} />}
          <ComplaintLayer complaints={visibleComplaints} basePath={basePath} />
        </MapContainer>
        
        {/* Simple Legend inside the map */}
        <Legend />
      </div>

      {/* Small Map Summary Footer */}
      <div className="h-12 bg-white border-t border-slate-200 flex items-center justify-center gap-6 text-[13px] font-semibold text-slate-700 z-10 px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Complaints:</span>
          <span className="text-slate-900">{stats.total}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Active Issues:</span>
          <span className="text-blue-600">{stats.active}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Resolved:</span>
          <span className="text-emerald-600">{stats.resolved}</span>
        </div>
      </div>
    </div>
  );
};

export default CityMap;
