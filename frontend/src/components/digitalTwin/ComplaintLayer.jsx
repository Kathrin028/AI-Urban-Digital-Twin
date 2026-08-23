import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ComplaintLayer = ({ complaints }) => {
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

      const marker = L.circleMarker([pt.lat, pt.lng], {
        radius: 7,
        color: '#ffffff',
        fillColor: fillColor,
        fillOpacity: 0.95,
        weight: 2,
      });

      // Extract confidence safely
      let conf = 'N/A';
      const aiConf = pt.aiPrediction?.confidence ?? pt.ai_prediction?.confidence;
      if (typeof aiConf === 'number') {
        conf = (aiConf * 100).toFixed(0) + '%';
      } else if (aiConf) {
        conf = aiConf;
      }

      // Calculations for clusters
      const totalReports = pt.related_report_count || 1;
      const duplicateReports = totalReports > 0 ? totalReports - 1 : 0;
      
      const estRes = pt.estimated_resolution || 'Not Available Yet';
      const createdDate = pt.date ? new Date(pt.date).toLocaleDateString() : (pt.created_at ? new Date(pt.created_at).toLocaleDateString() : 'Not available');

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${pt.category || 'Unknown'}
          </h3>
          
          <div style="display: grid; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Status</span>
              <span style="color: #0f172a; font-weight: 700;">${pt.status || 'Pending'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Priority</span>
              <span style="color: ${fillColor}; font-weight: 800; text-transform: uppercase;">${p}</span>
            </div>
            
            <div style="height: 1px; background-color: #f1f5f9; margin: 2px 0;"></div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Total Reports</span>
              <span style="color: #0f172a; font-weight: 700;">${totalReports}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Duplicates</span>
              <span style="color: #0f172a; font-weight: 600;">${duplicateReports}</span>
            </div>
            
            <div style="height: 1px; background-color: #f1f5f9; margin: 2px 0;"></div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Est. Resolution</span>
              <span style="color: #0f172a; font-weight: 600;">${estRes}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">AI Confidence</span>
              <span style="color: #0f172a; font-weight: 600;">${conf}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Created</span>
              <span style="color: #334155; font-weight: 500;">${createdDate}</span>
            </div>
          </div>
          
          <a href="/admin/complaints/${pt.id}" 
             style="display: block; margin-top: 12px; padding: 8px 0; text-align: center; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; transition: background-color 0.2s;">
            View Complaint
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Advanced Interaction: Smooth FlyTo and temporary highlight on click
      marker.on('click', () => {
        map.flyTo([pt.lat, pt.lng], 17, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        
        // Brief selection animation
        marker.setStyle({ color: '#fbbf24', weight: 4, radius: 10 });
        setTimeout(() => {
          if (map) marker.setStyle({ color: '#ffffff', weight: 2, radius: 7 });
        }, 1500);
      });

      clusterGroup.addLayer(marker);
    });
    
    map.addLayer(clusterGroup);
    
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [complaints, map]);
  
  return null;
};

export default ComplaintLayer;
