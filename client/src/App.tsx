import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import InvoiceDetails from "@/pages/InvoiceDetails";
import CreateInvoice from "@/pages/CreateInvoice";
import Clients from "@/pages/Clients";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";
import { InvoiceProvider } from "./context/InvoiceContext";

function Router() {
  return (
    <Switch>
      {/* Add pages */}
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/create" component={CreateInvoice} />
      <Route path="/invoices/:id" component={InvoiceDetails} />
      <Route path="/clients" component={Clients} />
      <Route path="/settings" component={Settings} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InvoiceProvider>
          <Layout>
            <Toaster />
            <Router />
          </Layout>
        </InvoiceProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
