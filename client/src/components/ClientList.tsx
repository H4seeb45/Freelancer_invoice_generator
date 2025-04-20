import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { useInvoice } from "../context/InvoiceContext";

interface ClientListProps {
  compact?: boolean;
  onClientSelect?: (client: Client) => void;
}

export default function ClientList({ compact = false, onClientSelect }: ClientListProps) {
  const { createInvoiceForClient } = useInvoice();
  
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Get client initials
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`;
    }
    return words[0].charAt(0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clients?.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-2">No clients found</p>
        <Link href="/clients">
          <Button>Add New Client</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-3 space-y-3">
      {clients.slice(0, compact ? 3 : clients.length).map((client) => (
        <li key={client.id} className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <span>{getInitials(client.name)}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{client.name}</p>
              {!compact && (
                <p className="text-xs text-gray-500">{client.email}</p>
              )}
            </div>
          </div>
          {onClientSelect ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onClientSelect(client)}
            >
              Select
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-primary hover:bg-primary hover:text-white"
              onClick={() => createInvoiceForClient(client)}
            >
              Invoice
            </Button>
          )}
        </li>
      ))}
      {compact && clients.length > 3 && (
        <li className="text-center py-2">
          <Link href="/clients">
            <a className="text-sm text-primary hover:underline">
              View all clients
            </a>
          </Link>
        </li>
      )}
    </ul>
  );
}
