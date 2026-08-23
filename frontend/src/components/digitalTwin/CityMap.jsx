import { useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import ComplaintLayer from './ComplaintLayer';
import HotspotLayer from './HotspotLayer';
import HeatmapLayer from './HeatmapLayer';
import Legend from './Legend';
import MiniDashboard from './MiniDashboard';
import TimelineSlider from './TimelineSlider';
import LayerControls from './LayerControls';
import AdvancedFilters from './AdvancedFilters';
import MapSearch from './MapSearch';

// Fit map view to visible points
function FitBounds({ points, hotspots }) {
  const map = useMap();
  useEffect(() => {
    let allPoints = [];
    if (points && points.length > 0) {
      points.forEach(p => {
        if (!isNaN(p.lat) && !isNaN(p.lng)) allPoints.push([p.lat, p.lng]);
      });
    } else if (hotspots && hotspots.length > 0) {
      hotspots.forEach(hs => {
        if (!isNaN(hs.latitude) && !isNaN(hs.longitude)) allPoints.push([hs.latitude, hs.longitude]);
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
  }, [points, hotspots, map]);
  return null;
}

// Controller to handle search zooms
function SearchController({ selectedLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation && map) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 18, {
        duration: 1.5
      });
    }
  }, [selectedLocation, map]);
  return null;
}

const CityMap = ({ complaints, hotspots, isAdmin }) => {
  // Layer Toggles
  const [layerConfig, setLayerConfig] = useState({
    showComplaints: true,
    showHeatmap: true,
    showHotspots: true,
    showDashboard: true
  });

  const toggleLayer = useCallback((layerName) => {
    setLayerConfig(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  }, []);

  // Filters
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [advFilters, setAdvFilters] = useState({ status: '', category: '', priority: '' });
  
  const handleAdvFilterChange = useCallback((key, value) => {
    setAdvFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Memoized Filtered Complaints
  const visibleComplaints = useMemo(() => {
    if (!complaints) return [];
    
    let now = new Date();
    let cutoff = new Date(0);
    
    if (timelineFilter === 'today') {
      cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
    } else if (timelineFilter === '7days') {
      cutoff.setDate(now.getDate() - 7);
    } else if (timelineFilter === '30days') {
      cutoff.setDate(now.getDate() - 30);
    }

    return complaints.filter(c => {
      // Timeline
      const d = new Date(c.date || c.created_at);
      if (d < cutoff) return false;

      // Advanced Filters
      if (advFilters.status && c.status !== advFilters.status) return false;
      if (advFilters.category && c.category !== advFilters.category) return false;
      
      const p = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority;
      if (advFilters.priority && p !== advFilters.priority) return false;

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchId = c.id && c.id.toLowerCase().includes(query);
        const matchCat = c.category && c.category.toLowerCase().includes(query);
        const matchStatus = c.status && c.status.toLowerCase().includes(query);
        const matchDesc = c.description && c.description.toLowerCase().includes(query);
        if (!matchId && !matchCat && !matchStatus && !matchDesc) return false;
      }

      return true;
    });
  }, [complaints, timelineFilter, advFilters, searchQuery]);

  // Handle Search Execution (Finds first match and centers map)
  const executeSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const target = visibleComplaints.find(c => {
        const q = query.toLowerCase();
        return (c.id && c.id.toLowerCase().includes(q)) || 
               (c.category && c.category.toLowerCase().includes(q)) ||
               (c.status && c.status.toLowerCase().includes(q));
      });
      if (target) {
        setSelectedLocation({ lat: target.lat, lng: target.lng, id: target.id });
      }
    } else {
      setSelectedLocation(null);
    }
  }, [visibleComplaints]);

  // Hotspots are strictly global but can be toggled
  const visibleHotspots = useMemo(() => {
    if (!isAdmin || !hotspots) return [];
    return hotspots;
  }, [hotspots, isAdmin]);

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-inner">
      <TimelineSlider currentFilter={timelineFilter} onFilterChange={setTimelineFilter} />
      
      {isAdmin && (
        <>
          <LayerControls config={layerConfig} onToggle={toggleLayer} />
          <AdvancedFilters filters={advFilters} onFilterChange={handleAdvFilterChange} />
          <MapSearch onSearch={executeSearch} />
          {layerConfig.showDashboard && <MiniDashboard complaints={visibleComplaints} hotspots={visibleHotspots} />}
        </>
      )}
      
      <Legend />
      
      <MapContainer
        center={[11.0168, 76.9558]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        
        <CustomZoomControl />
        <MapFixer />
        <FitBounds points={visibleComplaints} hotspots={visibleHotspots} />
        <SearchController selectedLocation={selectedLocation} />
        
        {layerConfig.showHeatmap && <HeatmapLayer complaints={visibleComplaints} />}
        {layerConfig.showHotspots && isAdmin && <HotspotLayer hotspots={visibleHotspots} />}
        {layerConfig.showComplaints && <ComplaintLayer complaints={visibleComplaints} />}
        
      </MapContainer>
    </div>
  );
};

import { ZoomControl } from 'react-leaflet';
const CustomZoomControl = () => {
  return <ZoomControl position="bottomleft" />;
};

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

export default CityMap;
