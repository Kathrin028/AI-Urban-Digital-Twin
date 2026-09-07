import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ComplaintLayer = ({ complaints, basePath = '/admin/complaints' }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !complaints) return;
    
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 40,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${cluster.getChildCount()}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(30, 30)
        });
      }
    });
    
    complaints.forEach(pt => {
      const p = pt.priority || pt.aiPrediction?.priority || pt.ai_prediction?.priority || 'Not Available';
      let fillColor = '#10b981'; // Low
      if (p === 'Medium') fillColor = '#f97316'; // Orange
      if (p === 'High') fillColor = '#ef4444'; // Red
      if (p === 'Critical') fillColor = '#b91c1c'; // Dark Red / Critical

      const marker = L.marker([pt.lat, pt.lng], {
        icon: L.divIcon({
          html: `<div style="background-color: ${fillColor}; border: 2px solid #ffffff; width: 14px; height: 14px; border-radius: 50%; opacity: 0.95; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
          className: '', // empty to avoid default leaflet styles
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -7]
        })
      });

      const createdDate = pt.date ? new Date(pt.date).toLocaleDateString() : (pt.created_at ? new Date(pt.created_at).toLocaleDateString() : 'Not available');

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; letter-spacing: 0.5px;">
            Complaint #${pt.id ? pt.id.substring(0,8).toUpperCase() : 'UNKNOWN'}
          </h3>
          
          <div style="display: grid; gap: 8px; font-size: 12px;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px; margin-bottom: 4px;">${pt.category || 'Unknown Category'}</div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Priority</span>
              <span style="color: ${fillColor}; font-weight: 800; text-transform: uppercase;">${p}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Status</span>
              <span style="color: #0f172a; font-weight: 700;">${pt.status || 'Pending'}</span>
            </div>
            
            ${pt.assigned_department_name ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Department</span>
              <span style="color: #0f172a; font-weight: 600; text-align: right; max-width: 120px;">${pt.assigned_department_name}</span>
            </div>` : ''}
            
            <div style="height: 1px; background-color: #f1f5f9; margin: 2px 0;"></div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Last Updated</span>
              <span style="color: #334155; font-weight: 500;">${pt.updated_at ? new Date(pt.updated_at).toLocaleString() : createdDate}</span>
            </div>
          </div>
          
          <a href="${basePath}/${pt.id}" 
             style="display: block; margin-top: 12px; padding: 8px 0; text-align: center; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; transition: background-color 0.2s;">
            View Details &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      clusterGroup.addLayer(marker);
    });
    
    map.addLayer(clusterGroup);
    
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [complaints, map, basePath]);
  
  return null;
};

export default ComplaintLayer;
