
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { DashboardStats, Invoice } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function Analytics() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  // Calculate and sort monthly revenue data
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
  }, [])
    .sort((a, b) => a.monthOrder - b.monthOrder) || [];

  const statusData = [
    { name: 'Pending', value: stats?.pendingPayment || 0 },
    { name: 'Paid', value: stats?.paid || 0 },
  ];

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
            <ChartContainer className="h-[350px]" config={{
              revenue: { theme: { light: "#0ea5e9", dark: "#38bdf8" } }
            }}>
              <BarChart data={monthlyRevenue}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.month}
                            </span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(payload[0].value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
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
            <ChartContainer className="h-[350px]" config={{
              pending: { theme: { light: "#f97316", dark: "#fb923c" } },
              paid: { theme: { light: "#22c55e", dark: "#4ade80" } }
            }}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.name}
                            </span>
                            <span className="font-bold text-foreground">
                              {payload[0].value} invoices
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={({ name }) => name === 'Pending' ? 'var(--color-pending)' : 'var(--color-paid)'}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
