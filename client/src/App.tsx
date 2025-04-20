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
import AuthPage from "@/pages/auth-page";
import Layout from "@/components/Layout";
import { InvoiceProvider } from "./context/InvoiceContext";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <InvoiceProvider>
            <Toaster />
            <Switch>
              <Route path="/auth">
                <AuthPage />
              </Route>
              <Route path="/:rest*">
                <Layout>
                  <Switch>
                    <ProtectedRoute path="/" component={Dashboard} />
                    <ProtectedRoute path="/invoices" component={Invoices} />
                    <ProtectedRoute path="/invoices/create" component={CreateInvoice} />
                    <ProtectedRoute path="/invoices/:id" component={InvoiceDetails} />
                    <ProtectedRoute path="/clients" component={Clients} />
                    <ProtectedRoute path="/settings" component={Settings} />
                    <Route component={NotFound} />
                  </Switch>
                </Layout>
              </Route>
            </Switch>
          </InvoiceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
