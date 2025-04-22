import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import InvoiceDetails from "@/pages/InvoiceDetails";
import CreateInvoice from "@/pages/CreateInvoice";
import PaymentPage from "@/pages/PaymentPage";
import Clients from "@/pages/Clients";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/auth-page";
import Layout from "@/components/Layout";
import { InvoiceProvider } from "./context/InvoiceContext";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Subscription from "./pages/Subscription"; // Added import

function MainApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/create" component={CreateInvoice} />
        <Route path="/invoices/:id/edit">
          {(params) => <CreateInvoice params={params} />}
        </Route>
        <Route path="/invoices/:id/pay">
          {(params) => <PaymentPage id={params.id} />}
        </Route>
        <Route path="/invoices/:id">
          {(params) => <InvoiceDetails params={params} />}
        </Route>
        <Route path="/clients" component={Clients} />
        <Route path="/settings" component={Settings} />
        <Route path="/subscription" component={Subscription} /> {/* Added route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <InvoiceProvider>
            <Toaster />
            <MainApp />
          </InvoiceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;