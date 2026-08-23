import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const HeatmapLayer = ({ complaints }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !complaints) return;
    
    // Simulating Heatmap by mapping heavily transparent, large circles.
    // In areas with dense coordinates, opacity compounds.
    const layerGroup = L.layerGroup();
    
    complaints.forEach(pt => {
      // 0.05 opacity compounds nicely on overlap
      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: 35, // Static pixel radius covers area smoothly
        color: 'transparent',
        fillColor: '#3b82f6', // Blueprint/cool tone heatmap base
        fillOpacity: 0.03, // Extremely faint base, dense clusters will appear solid blue/purple
        interactive: false // Heatmap points shouldn't block clicking
      });
      
      const core = L.circleMarker([pt.lat, pt.lng], {
        radius: 12,
        color: 'transparent',
        fillColor: '#ef4444', // Hot core
        fillOpacity: 0.02, 
        interactive: false
      });
      
      layerGroup.addLayer(circle);
      layerGroup.addLayer(core);
    });
    
    map.addLayer(layerGroup);
    
    return () => {
      map.removeLayer(layerGroup);
    };
  }, [complaints, map]);
  
  return null;
};

export default HeatmapLayer;
