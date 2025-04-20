import { Invoice, Client, LineItem } from "@shared/schema";

interface CSVData {
  invoice: Invoice;
  client: Client;
  lineItems: LineItem[];
}

export const generateCSV = ({ invoice, client, lineItems }: CSVData) => {
  // Build CSV headers
  const headers = [
    "Invoice Number",
    "Date",
    "Due Date",
    "Status",
    "Client Name",
    "Client Email",
    "Client Address",
    "Item Description",
    "Quantity",
    "Rate",
    "Amount",
    "Subtotal",
    "Tax Rate",
    "Tax Amount",
    "Total",
    "Notes"
  ];
  
  // Format dates
  const formatDate = (date: Date | string) => {
    return new Date(date).toISOString().split('T')[0];
  };
  
  // Build CSV rows
  const rows: string[][] = [];
  
  // Add each line item as a separate row
  lineItems.forEach((item, index) => {
    const row = [
      invoice.invoiceNumber,
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      invoice.status,
      client.name,
      client.email || "",
      client.address || "",
      item.description,
      item.quantity.toString(),
      item.rate.toString(),
      item.amount.toString(),
      index === 0 ? invoice.subtotal.toString() : "", // Only show these on the first row
      index === 0 ? invoice.taxRate.toString() : "",
      index === 0 ? invoice.taxAmount.toString() : "",
      index === 0 ? invoice.total.toString() : "",
      index === 0 ? invoice.notes || "" : ""
    ];
    
    rows.push(row);
  });
  
  // If no line items, still add a row with the invoice data
  if (lineItems.length === 0) {
    const row = [
      invoice.invoiceNumber,
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      invoice.status,
      client.name,
      client.email || "",
      client.address || "",
      "",
      "",
      "",
      "",
      invoice.subtotal.toString(),
      invoice.taxRate.toString(),
      invoice.taxAmount.toString(),
      invoice.total.toString(),
      invoice.notes || ""
    ];
    
    rows.push(row);
  }
  
  // Convert to CSV format
  const headerLine = headers.map(header => `"${header}"`).join(",");
  const dataLines = rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
  );
  
  const csvContent = [headerLine, ...dataLines].join("\n");
  
  // Create a blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Invoice_${invoice.invoiceNumber}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
