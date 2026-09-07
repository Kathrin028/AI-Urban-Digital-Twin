export const generateDashboardSuggestions = (complaints) => {
  if (!complaints || complaints.length === 0) return [];
  
  const suggestions = [];
  
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  if (pendingCount > 0) {
    suggestions.push({
      id: 'pending-warning',
      type: 'warning',
      text: `You have ${pendingCount} pending complaint${pendingCount !== 1 ? 's' : ''}.`
    });
  }

  const highPriorityCount = complaints.filter(c => c.ai_priority === 'High' || c.priority === 'High' || c.priority === 'Critical').length;
  if (highPriorityCount > 0) {
    suggestions.push({
      id: 'high-priority',
      type: 'critical',
      text: `You have ${highPriorityCount} high-priority complaint${highPriorityCount !== 1 ? 's' : ''}.`
    });
  }

  const inProgressComplaints = complaints.filter(c => c.status === 'In Progress');
  if (inProgressComplaints.length > 0) {
    // Just show the first one as an example
    suggestions.push({
      id: 'in-progress-info',
      type: 'info',
      text: `Your complaint #${inProgressComplaints[0].id ? inProgressComplaints[0].id.substring(0,8).toUpperCase() : 'UNKNOWN'} is currently In Progress.`
    });
  }

  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  if (resolvedCount > 0) {
    suggestions.push({
      id: 'resolved-info',
      type: 'success',
      text: `You have ${resolvedCount} resolved complaint${resolvedCount !== 1 ? 's' : ''}.`
    });
  }

  if (suggestions.length === 0) {
     suggestions.push({
      id: 'general-info',
      type: 'info',
      text: `Thank you for contributing to your city.`
    });
  }

  return suggestions;
};
