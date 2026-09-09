import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const exportTableToCSV = (headers: string[], rows: any[][], filename: string) => {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTableToPDF = (title: string, headers: string[], rows: any[][], filename: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  (doc as any).autoTable({
    startY: 25,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
