import { createContext, useContext, useState, ReactNode } from "react";
import { Client } from "@shared/schema";
import { useLocation } from "wouter";

interface InvoiceContextType {
  createInvoiceForClient: (client: Client) => void;
}

const InvoiceContext = createContext<InvoiceContextType>({
  createInvoiceForClient: () => {},
});

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();

  // Navigate to create invoice page with client pre-selected
  const createInvoiceForClient = (client: Client) => {
    navigate(`/invoices/create?clientId=${client.id}`);
  };

  return (
    <InvoiceContext.Provider
      value={{
        createInvoiceForClient,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  return useContext(InvoiceContext);
}
