import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export Complaints to CSV
export const exportComplaintsToCSV = (complaints, filename = 'complaints_export.csv') => {
  if (!complaints || !complaints.length) return;

  const headers = ['Complaint ID', 'Category', 'Priority', 'Status', 'Created Date', 'Description'];
  
  const csvRows = [headers.join(',')];

  complaints.forEach(c => {
    const id = c.id || c._id || 'N/A';
    const category = c.category || 'N/A';
    const priority = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority || 'N/A';
    const status = c.status || 'N/A';
    const date = new Date(c.date || c.created_at).toLocaleDateString();
    
    // Clean description to avoid breaking CSV
    let desc = c.description ? c.description.replace(/"/g, '""') : 'N/A';
    desc = `"${desc}"`;

    csvRows.push([id, category, priority, status, date, desc].join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Complaints to PDF
export const exportComplaintsToPDF = (complaints, filename = 'complaints_report.pdf') => {
  if (!complaints || !complaints.length) return;

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('UrbanMind AI - Complaints Report', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Records: ${complaints.length}`, 14, 36);

  const tableColumn = ["ID", "Category", "Priority", "Status", "Date"];
  const tableRows = [];

  complaints.forEach(c => {
    const id = c.id || c._id || 'N/A';
    const shortId = id.substring(0, 8);
    const category = c.category || 'N/A';
    const priority = c.priority || c.aiPrediction?.priority || c.ai_prediction?.priority || 'N/A';
    const status = c.status || 'N/A';
    const date = new Date(c.date || c.created_at).toLocaleDateString();

    tableRows.push([shortId, category, priority, status, date]);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 42,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(filename);
};

// Export Analytics Summary to PDF
export const exportAnalyticsToPDF = (stats, filename = 'analytics_summary.pdf') => {
  if (!stats) return;

  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('UrbanMind AI - Smart Analytics Summary', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('System Overview', 14, 45);

  const overviewData = [
    ['Total Complaints', stats.total_complaints?.toString() || '0'],
    ['Resolution Rate', stats.resolution_rate || '0%'],
    ['Avg Resolution Time', stats.avg_resolution_time_days ? `${stats.avg_resolution_time_days} days` : 'N/A'],
    ['Avg AI Confidence', stats.avg_ai_confidence ? `${stats.avg_ai_confidence}` : 'N/A']
  ];

  doc.autoTable({
    body: overviewData,
    startY: 50,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
  });

  const nextY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.text('Priority Distribution', 14, nextY);
  
  const prioData = Object.entries(stats.priority_distribution || {}).map(([k, v]) => [k, v.toString()]);
  
  doc.autoTable({
    head: [['Priority Level', 'Count']],
    body: prioData,
    startY: nextY + 5,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }
  });

  doc.save(filename);
};
