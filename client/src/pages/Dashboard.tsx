import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckIcon, 
  DollarSignIcon,
  PlusIcon
} from "lucide-react";
import StatCard from "@/components/StatCard";
import InvoiceTable from "@/components/InvoiceTable";
import ClientList from "@/components/ClientList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Invoice, Client, DashboardStats } from "@shared/schema";

interface InvoiceWithClient extends Invoice {
  client?: Client;
}

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch recent invoices with client info
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<InvoiceWithClient[]>({
    queryKey: ['/api/invoices'],
  });

  // Format currency for displaying
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">Overview of your invoicing activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Invoices Issued"
          value={isLoadingStats ? "Loading..." : stats?.invoicesIssued.toString() || "0"}
          icon={<FileTextIcon className="w-6 h-6" />}
          bgColor="bg-primary"
          href="/invoices"
        />
        <StatCard
          title="Pending Payment"
          value={isLoadingStats ? "Loading..." : stats?.pendingPayment.toString() || "0"}
          icon={<ClockIcon className="w-6 h-6" />}
          bgColor="bg-warning"
          href="/invoices?status=pending"
        />
        <StatCard
          title="Paid"
          value={isLoadingStats ? "Loading..." : stats?.paid.toString() || "0"}
          icon={<CheckIcon className="w-6 h-6" />}
          bgColor="bg-success"
          href="/invoices?status=paid"
        />
        <StatCard
          title="Total Revenue"
          value={isLoadingStats ? "Loading..." : formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSignIcon className="w-6 h-6" />}
          bgColor="bg-accent"
          href="/invoices?status=paid"
        />
      </div>

      {/* Recent Invoices and Create Invoice Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Invoices</h3>
          </div>
          <InvoiceTable 
            invoices={invoices?.slice(0, 4) || []} 
            isLoading={isLoadingInvoices} 
          />
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Link href="/invoices">
              <a className="text-sm font-medium text-primary hover:text-primary-dark">
                View all invoices
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Quick Create Invoice */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Invoice</h3>
          </div>
          <div className="p-6">
            <Link href="/invoices/create">
              <Button className="w-full mb-4">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mb-4">
              Quickly create and send professional invoices to your clients.
            </p>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900">Recent Clients</h4>
              <ClientList compact={true} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
