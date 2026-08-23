// src/services/hotspotService.js

// Simple Euclidean distance for mock clustering
function getDistance(lat1, lon1, lat2, lon2) {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
}

// Distance threshold for clustering (~1-2km)
const CLUSTER_RADIUS = 0.015;

export function detectHotspots(complaints) {
  const hotspots = [];

  const points = complaints.filter(
    c => c.location && !isNaN(parseFloat(c.location.latitude)) && !isNaN(parseFloat(c.location.longitude))
  );

  // Simple deterministic clustering (O(n^2) mock approach)
  points.forEach(pt => {
    const lat = parseFloat(pt.location.latitude);
    const lng = parseFloat(pt.location.longitude);
    
    let addedToHotspot = false;
    for (let hotspot of hotspots) {
      if (getDistance(hotspot.center.lat, hotspot.center.lng, lat, lng) < CLUSTER_RADIUS) {
        hotspot.complaints.push(pt);
        // Update center
        hotspot.center.lat = (hotspot.center.lat * (hotspot.complaints.length - 1) + lat) / hotspot.complaints.length;
        hotspot.center.lng = (hotspot.center.lng * (hotspot.complaints.length - 1) + lng) / hotspot.complaints.length;
        addedToHotspot = true;
        break;
      }
    }

    if (!addedToHotspot) {
      hotspots.push({
        id: 'hs-' + pt.id,
        center: { lat, lng },
        complaints: [pt]
      });
    }
  });

  const finalHotspots = [];
  const singleMarkers = [];

  hotspots.forEach(hs => {
    if (hs.complaints.length > 1) {
      // Calculate Analytics for Hotspot
      let highPriorityCount = 0;
      let pendingCount = 0;
      const categoryCounts = {};

      hs.complaints.forEach(c => {
        const priority = c.priority || c.aiPrediction?.priority || 'Unknown';
        if (priority === 'High') highPriorityCount++;
        
        if (c.status === 'Pending') pendingCount++;
        
        const cat = c.category || 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      // Dominant Category
      let dominantCategory = 'Unknown';
      let maxCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantCategory = cat;
        }
      }

      // Severity logic
      let severity = 'Low';
      if (highPriorityCount > 0 || pendingCount >= 3 || hs.complaints.length >= 5) {
        severity = 'High';
      } else if (pendingCount > 0 || hs.complaints.length >= 3) {
        severity = 'Medium';
      }

      hs.analytics = {
        count: hs.complaints.length,
        highPriorityCount,
        pendingCount,
        dominantCategory,
        severity
      };
      
      finalHotspots.push(hs);
    } else {
      singleMarkers.push(hs.complaints[0]);
    }
  });

  return { hotspots: finalHotspots, singleMarkers };
}
