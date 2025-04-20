import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdf-generator";
import { generateCSV } from "@/lib/csv-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LineItemsTable from "./LineItemsTable";
import { useToast } from "@/hooks/use-toast";
import { Invoice, Client, LineItem, InvoiceStatus } from "@shared/schema";
import {
  DownloadIcon,
  FileTextIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  Edit3Icon,
  CreditCardIcon,
} from "lucide-react";

interface InvoicePreviewProps {
  invoice: Invoice;
  client: Client;
  lineItems: LineItem[];
  onStatusChange?: () => void;
}

export default function InvoicePreview({
  invoice,
  client,
  lineItems,
  onStatusChange,
}: InvoicePreviewProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  // Handle status change
  const handleStatusChange = async (status: string) => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", `/api/invoices/${invoice.id}/status`, { status });
      toast({
        title: "Status Updated",
        description: `Invoice status changed to ${status}`,
      });
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckIcon className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <ClockIcon className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangleIcon className="w-3 h-3 mr-1" /> Overdue
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <FileTextIcon className="w-3 h-3 mr-1" /> Draft
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Format payment terms
  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case "due_on_receipt":
        return "Due on Receipt";
      case "net_15":
        return "Net 15";
      case "net_30":
        return "Net 30";
      case "net_60":
        return "Net 60";
      default:
        return terms;
    }
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    generatePDF({
      invoice,
      client,
      lineItems,
      formatCurrency,
      formatDate,
    });
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    generateCSV({
      invoice,
      client,
      lineItems,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Invoice Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Invoice {invoice.invoiceNumber}
          </h2>
          <div className="mt-1 flex items-center">
            {getStatusBadge(invoice.status)}
            <span className="ml-3 text-sm text-gray-600">
              {formatDate(invoice.issueDate)}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <DownloadIcon className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <DownloadIcon className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit3Icon className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Body */}
      <div className="p-6">
        {/* From / To section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500">From</h3>
            <div className="mt-2">
              <p className="text-base font-medium text-gray-800">
                Sam Wilson Freelance
              </p>
              <p className="text-sm text-gray-600">
                123 Main St, San Francisco, CA 94101
              </p>
              <p className="text-sm text-gray-600">sam@example.com</p>
              <p className="text-sm text-gray-600">415-555-1234</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">To</h3>
            <div className="mt-2">
              <p className="text-base font-medium text-gray-800">
                {client.name}
              </p>
              {client.address && (
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {client.address}
                </p>
              )}
              {client.email && (
                <p className="text-sm text-gray-600">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-600">{client.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-xs font-medium text-gray-500">Invoice Number</h3>
              <p className="text-sm font-medium text-gray-800 font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Issue Date</h3>
              <p className="text-sm text-gray-800">
                {formatDate(invoice.issueDate)}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Due Date</h3>
              <p className="text-sm text-gray-800">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Payment Terms</h3>
              <p className="text-sm text-gray-800">
                {formatPaymentTerms(invoice.paymentTerms)}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Items</h3>
          <LineItemsTable items={lineItems} onItemsChange={() => {}} readOnly={true} />
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-medium text-gray-800">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-600">
              Tax ({Number(invoice.taxRate)}%)
            </span>
            <span className="text-sm font-medium text-gray-800">
              {formatCurrency(invoice.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
            <span className="text-base font-medium text-gray-800">Total</span>
            <span className="text-base font-bold text-gray-800">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Payment Actions */}
        {(invoice.status === InvoiceStatus.PENDING || invoice.status === InvoiceStatus.OVERDUE) && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Payment Options
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link href={`/invoices/${invoice.id}/pay`}>
                <Button
                  size="sm"
                  disabled={isLoading}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <CreditCardIcon className="w-4 h-4 mr-2" /> Pay Online
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Status Actions */}
        {invoice.status !== InvoiceStatus.PAID && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Update Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {invoice.status !== InvoiceStatus.PENDING && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(InvoiceStatus.PENDING)}
                  disabled={isLoading}
                >
                  <ClockIcon className="w-4 h-4 mr-2" /> Mark as Pending
                </Button>
              )}
              {invoice.status !== InvoiceStatus.PAID && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(InvoiceStatus.PAID)}
                  disabled={isLoading}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <CheckIcon className="w-4 h-4 mr-2" /> Mark as Paid
                </Button>
              )}
              {invoice.status !== InvoiceStatus.OVERDUE && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(InvoiceStatus.OVERDUE)}
                  disabled={isLoading}
                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                  <AlertTriangleIcon className="w-4 h-4 mr-2" /> Mark as Overdue
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
