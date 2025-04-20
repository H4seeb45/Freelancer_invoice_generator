import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusIcon, Search, FilterIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoiceTable from "@/components/InvoiceTable";
import { Invoice, Client, InvoiceStatus } from "@shared/schema";

interface InvoiceWithClient extends Invoice {
  client?: Client;
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Fetch all invoices
  const { data: invoices, isLoading } = useQuery<InvoiceWithClient[]>({
    queryKey: ['/api/invoices'],
  });

  // Filter invoices based on search term and status
  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = searchTerm === "" || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(undefined);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Invoices</h2>
          <p className="mt-1 text-sm text-gray-600">Manage and track your client invoices</p>
        </div>
        <Link href="/invoices/create">
          <Button className="mt-4 sm:mt-0">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={InvoiceStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                  <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || statusFilter) && (
              <Button variant="ghost" onClick={clearFilters} className="sm:w-auto">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable 
            invoices={filteredInvoices} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </>
  );
}
