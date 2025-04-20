import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import LineItemsTable, { LineItem } from "./LineItemsTable";
import { invoiceFormSchema, InvoiceFormData, Client } from "@shared/schema";
import ClientList from "./ClientList";

interface InvoiceFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InvoiceFormData> & { id?: number };
  clients?: Client[];
}

export default function InvoiceForm({ onSuccess, initialData, clients }: InvoiceFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Set up form with validation
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: initialData?.clientId || 0,
      invoiceNumber: initialData?.invoiceNumber || '',
      issueDate: initialData?.issueDate || format(new Date(), 'yyyy-MM-dd'),
      dueDate: initialData?.dueDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      paymentTerms: initialData?.paymentTerms || 'net_30',
      taxRate: initialData?.taxRate || 0,
      notes: initialData?.notes || '',
      lineItems: initialData?.lineItems || [
        {
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0
        }
      ]
    }
  });

  // Generate invoice number if not provided
  useEffect(() => {
    if (!initialData?.invoiceNumber) {
      const fetchInvoiceNumber = async () => {
        try {
          const response = await fetch('/api/invoices/next-number');
          const data = await response.json();
          form.setValue('invoiceNumber', data.invoiceNumber);
        } catch (error) {
          console.error('Failed to fetch invoice number:', error);
        }
      };
      fetchInvoiceNumber();
    }
  }, [initialData?.invoiceNumber, form]);

  // Update client if initialData has clientId
  useEffect(() => {
    if (initialData?.clientId && clients) {
      const client = clients.find(c => c.id === initialData.clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [initialData?.clientId, clients]);

  // Calculate totals whenever line items or tax rate changes
  useEffect(() => {
    const lineItems = form.watch('lineItems');
    const taxRate = form.watch('taxRate');
    
    const calcSubtotal = lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const calcTaxAmount = (calcSubtotal * (taxRate || 0)) / 100;
    const calcTotal = calcSubtotal + calcTaxAmount;
    
    setSubtotal(calcSubtotal);
    setTaxAmount(calcTaxAmount);
    setTotal(calcTotal);
  }, [form.watch('lineItems'), form.watch('taxRate')]);

  // Handle form submission
  const onSubmit = async (data: InvoiceFormData) => {
    if (!selectedClient) {
      toast({
        title: "Client Required",
        description: "Please select a client for this invoice",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id 
        ? `/api/invoices/${initialData.id}` 
        : '/api/invoices';
      
      const response = await apiRequest(method, url, data);
      
      if (response.ok) {
        toast({
          title: initialData?.id ? "Invoice Updated" : "Invoice Created",
          description: initialData?.id
            ? "Your invoice has been updated successfully."
            : "Your invoice has been created successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating/updating invoice:', error);
      toast({
        title: "Error",
        description: `Failed to ${initialData?.id ? 'update' : 'create'} invoice. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to add days to a date
  function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Update due date based on payment terms
  const updateDueDate = (terms: string) => {
    const issueDate = new Date(form.getValues('issueDate'));
    let dueDate: Date;
    
    switch (terms) {
      case 'due_on_receipt':
        dueDate = new Date(issueDate);
        break;
      case 'net_15':
        dueDate = addDays(issueDate, 15);
        break;
      case 'net_30':
        dueDate = addDays(issueDate, 30);
        break;
      case 'net_60':
        dueDate = addDays(issueDate, 60);
        break;
      default:
        dueDate = addDays(issueDate, 30);
    }
    
    form.setValue('dueDate', format(dueDate, 'yyyy-MM-dd'));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle line items changes
  const handleLineItemsChange = (lineItems: LineItem[]) => {
    form.setValue('lineItems', lineItems, { shouldValidate: true });
  };

  // Select client handler
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    form.setValue('clientId', client.id, { shouldValidate: true });
    setShowClientSelector(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Number and Date section */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-gray-100 font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-3">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
                          field.onChange(formattedDate);
                          // Also update due date based on payment terms
                          if (date) {
                            updateDueDate(form.getValues('paymentTerms'));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Client section */}
          <div className="sm:col-span-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Client Information</h3>
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              {selectedClient ? (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{selectedClient.name}</h4>
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                    {selectedClient.address && (
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedClient.address}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientSelector(true)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No client selected</p>
                  <Button
                    type="button"
                    onClick={() => setShowClientSelector(true)}
                  >
                    Select Client
                  </Button>
                </div>
              )}
            </div>

            {showClientSelector && (
              <div className="border border-gray-200 rounded-md p-4 mt-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Select a Client</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClientSelector(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <ClientList onClientSelect={handleSelectClient} />
              </div>
            )}
          </div>

          {/* Line Items section */}
          <div className="sm:col-span-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Invoice Line Items</h3>
            <LineItemsTable
              items={form.watch('lineItems')}
              onItemsChange={handleLineItemsChange}
              errors={form.formState.errors as Record<string, string>}
            />
          </div>

          {/* Totals section */}
          <div className="sm:col-span-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-2">Tax:</span>
                  <div className="relative rounded-md shadow-sm w-24">
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber || 0;
                                field.onChange(value);
                              }}
                              className="pr-8"
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-base font-medium text-gray-900">Total:</span>
                <span className="text-base font-medium text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment terms */}
          <div className="sm:col-span-3">
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateDueDate(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-3">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
                          field.onChange(formattedDate);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional information or payment instructions..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData?.id ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
