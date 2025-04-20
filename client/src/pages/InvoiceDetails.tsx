import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoicePreview from "@/components/InvoicePreview";
import { Invoice, Client, LineItem } from "@shared/schema";

interface InvoiceDetailsProps {
  params: {
    id: string;
  };
}

export default function InvoiceDetails({ params }: InvoiceDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invoiceId = parseInt(params.id);

  // Check if id is valid
  if (isNaN(invoiceId)) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-800">Invalid Invoice ID</h2>
        <p className="mt-2 text-gray-600">The invoice ID provided is not valid.</p>
        <Link href="/invoices">
          <Button className="mt-4">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  // Fetch invoice details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
  });

  // Handle status change
  const handleStatusChange = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({
      queryKey: [`/api/invoices/${invoiceId}`],
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/invoices'],
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/dashboard/stats'],
    });
  };

  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data?.invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-gray-800">Invoice Not Found</h2>
        <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist.</p>
        <Link href="/invoices">
          <Button className="mt-4">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const { invoice, client, lineItems } = data;

  return (
    <>
      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="ghost" className="pl-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <InvoicePreview 
        invoice={invoice} 
        client={client} 
        lineItems={lineItems}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
