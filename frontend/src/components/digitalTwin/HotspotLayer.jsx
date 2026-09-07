import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const HotspotLayer = ({ hotspots }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !hotspots) return;
    
    const layerGroup = L.layerGroup();
    
    hotspots.forEach(hs => {
      let fillColor = '#ef4444'; // High
      if (hs.highest_priority_level === 'Medium') fillColor = '#f97316';
      if (hs.highest_priority_level === 'Low') fillColor = '#10b981';

      const baseRadius = 250;
      const scaledRadius = baseRadius + (Math.sqrt(hs.complaint_count || 1) * 30);

      const circle = L.circle([hs.latitude, hs.longitude], {
        radius: scaledRadius,
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 10'
      });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
          <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #0f172a; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid ${fillColor}40; padding-bottom: 8px;">
            📍 AI Hotspot Area
          </h3>
          <div style="display: grid; gap: 6px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Complaints:</span>
              <span style="color: #0f172a; font-weight: bold;">${hs.complaint_count}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Dominant Category:</span>
              <span style="color: #0f172a; font-weight: bold;">${hs.dominant_category}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Priority Score:</span>
              <span style="color: #0f172a; font-weight: bold;">${hs.priority_score.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
              <span style="color: #64748b; font-weight: 600;">Highest Priority:</span>
              <span style="color: ${fillColor}; font-weight: 800; text-transform: uppercase;">${hs.highest_priority_level}</span>
            </div>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);

      layerGroup.addLayer(circle);
    });
    
    map.addLayer(layerGroup);
    
    return () => {
      map.removeLayer(layerGroup);
    };
  }, [hotspots, map]);
  
  return null;
};

export default HotspotLayer;
