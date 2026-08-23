export const generateDashboardSuggestions = (complaints) => {
  if (!complaints || complaints.length === 0) return [];
  
  const suggestions = [];
  
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  if (pendingCount > 0) {
    suggestions.push({
      id: 'pending-warning',
      type: pendingCount > 5 ? 'critical' : 'warning',
      text: `${pendingCount} complaints are currently pending. Prioritize review.`
    });
  }

  const highPriorityCount = complaints.filter(c => c.ai_priority === 'High' || c.priority === 'High' || c.priority === 'Critical').length;
  if (highPriorityCount > 0) {
    suggestions.push({
      id: 'high-priority',
      type: 'critical',
      text: `${highPriorityCount} high-priority issues require immediate attention.`
    });
  }

  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  if (resolvedCount > 0) {
    suggestions.push({
      id: 'resolved-info',
      type: 'success',
      text: `${resolvedCount} complaints have been successfully resolved.`
    });
  }

  if (suggestions.length === 0) {
     suggestions.push({
      id: 'general-info',
      type: 'info',
      text: `Monitor incoming complaints to ensure timely resolution.`
    });
  }

  return suggestions;
};
