
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DashboardStats, Invoice } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function Analytics() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  // Calculate monthly revenue data
  const monthlyRevenue = invoices?.reduce((acc: any[], invoice) => {
    const month = new Date(invoice.issueDate).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.month === month);
    
    if (existingMonth) {
      existingMonth.revenue += parseFloat(invoice.total);
    } else {
      acc.push({ month, revenue: parseFloat(invoice.total) });
    }
    return acc;
  }, []) || [];

  // Calculate status distribution
  const statusData = [
    { name: 'Pending', value: stats?.pendingPayment || 0 },
    { name: 'Paid', value: stats?.paid || 0 },
  ];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Analytics</h2>
        <p className="mt-1 text-sm text-gray-600">Detailed invoice and revenue analytics</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]" config={{
              revenue: { theme: { light: "#0ea5e9", dark: "#38bdf8" } }
            }}>
              <BarChart data={monthlyRevenue}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Month
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.month}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revenue
                          </span>
                          <span className="font-bold">
                            {formatCurrency(payload[0].value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]" config={{
              pending: { theme: { light: "#f97316", dark: "#fb923c" } },
              paid: { theme: { light: "#22c55e", dark: "#4ade80" } }
            }}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Status
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.name}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Count
                          </span>
                          <span className="font-bold">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }} />
                <Bar dataKey="value" fill={({ name }) => 
                  name === 'Pending' ? 'var(--color-pending)' : 'var(--color-paid)'
                } />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
