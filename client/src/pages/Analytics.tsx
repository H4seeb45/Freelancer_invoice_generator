import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardStats, Invoice } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function Analytics() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const monthlyRevenue = invoices?.reduce((acc: any[], invoice) => {
    const date = new Date(invoice.issueDate);
    const month = date.toLocaleString('default', { month: 'short' });
    const monthOrder = date.getMonth();

    const existingMonth = acc.find(item => item.month === month);

    if (existingMonth) {
      existingMonth.revenue += Number(invoice.total);
    } else {
      acc.push({ month, monthOrder, revenue: Number(invoice.total) });
    }
    return acc;
  }, []).sort((a, b) => a.monthOrder - b.monthOrder) || [];

  const statusData = [
    { name: 'Pending', value: stats?.pendingPayment || 0 },
    { name: 'Paid', value: stats?.paid || 0 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Detailed invoice and revenue analytics</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="#2563eb"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}