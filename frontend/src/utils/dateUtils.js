/**
 * Formats a date string to Indian Standard Time (IST) 
 * prioritizing UTC if the backend returned a naive datetime.
 */
export const formatDateIST = (dateString) => {
  if (!dateString) return "Unknown";
  
  // If the date string doesn't have a timezone indicator, 
  // assume it is UTC to match the backend's datetime.utcnow()
  const safeDate = dateString.endsWith('Z') || dateString.includes('+') 
    ? dateString 
    : dateString + 'Z';
    
  const d = new Date(safeDate);
  
  if (isNaN(d.getTime())) return "Unknown";
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(d).toUpperCase();
};

/**
 * Formats a date string to Indian Standard Time (IST) date only
 */
export const formatDateISTShort = (dateString) => {
  if (!dateString) return "Unknown";
  
  const safeDate = dateString.endsWith('Z') || dateString.includes('+') 
    ? dateString 
    : dateString + 'Z';
    
  const d = new Date(safeDate);
  
  if (isNaN(d.getTime())) return "Unknown";
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};
