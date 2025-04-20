import { Invoice, Client, LineItem } from "@shared/schema";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface PDFData {
  invoice: Invoice;
  client: Client;
  lineItems: LineItem[];
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: string | Date) => string;
}

export const generatePDF = ({ 
  invoice, 
  client, 
  lineItems,
  formatCurrency,
  formatDate
}: PDFData) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: `Invoice ${invoice.invoiceNumber}`,
    subject: `Invoice for ${client.name}`,
    author: 'Invoice Generator',
    creator: 'Invoice Generator'
  });
  
  // Add logo/header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text('Invoice Generator', 15, 20);
  
  // Invoice number and date
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`INVOICE ${invoice.invoiceNumber}`, 15, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, 15, 40);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 15, 45);
  
  // Status
  doc.setFont('helvetica', 'bold');
  let statusColor;
  switch (invoice.status.toLowerCase()) {
    case 'paid':
      statusColor = [16, 185, 129]; // Green
      break;
    case 'pending':
      statusColor = [245, 158, 11]; // Yellow
      break;
    case 'overdue':
      statusColor = [239, 68, 68]; // Red
      break;
    default:
      statusColor = [107, 114, 128]; // Gray
  }
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, 50);
  doc.setTextColor(0, 0, 0);
  
  // From section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 15, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sam Wilson Freelance', 15, 65);
  doc.text('123 Main St, San Francisco, CA 94101', 15, 70);
  doc.text('sam@example.com', 15, 75);
  doc.text('415-555-1234', 15, 80);
  
  // To section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('To:', 120, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(client.name, 120, 65);
  if (client.address) {
    const addressLines = client.address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 120, 70 + (index * 5));
    });
  }
  if (client.email) {
    doc.text(client.email, 120, 85);
  }
  if (client.phone) {
    doc.text(client.phone, 120, 90);
  }
  
  // Line items table
  const tableColumn = ["Description", "Quantity", "Rate", "Amount"];
  const tableRows = lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);
  
  // Add the table
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 100,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    }
  });
  
  // Calculate where the table ended
  const finalY = (doc as any).lastAutoTable.finalY || 130;
  
  // Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, finalY + 10);
  doc.text(formatCurrency(invoice.subtotal), 170, finalY + 10, { align: 'right' });
  
  doc.text(`Tax (${Number(invoice.taxRate)}%):`, 140, finalY + 15);
  doc.text(formatCurrency(invoice.taxAmount), 170, finalY + 15, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, finalY + 25);
  doc.text(formatCurrency(invoice.total), 170, finalY + 25, { align: 'right' });
  
  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 15, finalY + 40);
    doc.setFont('helvetica', 'normal');
    
    // Wrap text to fit available width
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 15, finalY + 45);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};
