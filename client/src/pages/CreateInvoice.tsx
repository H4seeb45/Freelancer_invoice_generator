import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InvoiceForm from "@/components/InvoiceForm";
import { Client, Invoice, LineItem } from "@shared/schema";

interface CreateInvoiceProps {
  params?: {
    id?: string;
  };
}

export default function CreateInvoice({ params }: CreateInvoiceProps) {
  const [location, navigate] = useLocation();
  const isEditMode = Boolean(params?.id);
  const invoiceId = params?.id ? parseInt(params.id) : undefined;
  
  // Get client ID from URL query param (for pre-selecting client)
  const searchParams = new URLSearchParams(window.location.search);
  const clientIdParam = searchParams.get('clientId');
  const preselectedClientId = clientIdParam ? parseInt(clientIdParam) : undefined;

  // Fetch clients for the form
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // If in edit mode, fetch the invoice details
  const { data: invoiceData } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: isEditMode && !isNaN(Number(invoiceId)),
  });

  // Handle successful form submission
  const handleSuccess = () => {
    navigate('/invoices');
  };

  // Prepare initial form data if in edit mode
  const getInitialFormData = () => {
    if (!isEditMode || !invoiceData?.invoice) return undefined;

    const { invoice, lineItems } = invoiceData;
    
    return {
      id: invoice.id,
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      paymentTerms: invoice.paymentTerms,
      taxRate: Number(invoice.taxRate),
      notes: invoice.notes || '',
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
    };
  };

  // If clientId is in the URL, initialize form with that client
  const initialData = isEditMode 
    ? getInitialFormData() 
    : preselectedClientId 
      ? { clientId: preselectedClientId } 
      : undefined;

  return (
    <>
      <div className="mb-6">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent"
          onClick={() => navigate('/invoices')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm 
            onSuccess={handleSuccess} 
            initialData={initialData}
            clients={clients}
          />
        </CardContent>
      </Card>
    </>
  );
}
