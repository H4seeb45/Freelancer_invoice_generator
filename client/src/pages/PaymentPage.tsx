import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Invoice, Client, LineItem } from '@shared/schema';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ clientSecret, invoiceNumber, amount }: { clientSecret: string, invoiceNumber: string, amount: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment!",
      });
      // Redirect to invoice page
      setLocation('/invoices');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 py-4">
        <div className="grid gap-2">
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-gray-500">Invoice Number:</p>
            <p className="col-span-2 text-sm font-semibold">{invoiceNumber}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-gray-500">Amount:</p>
            <p className="col-span-2 text-sm font-semibold">${parseFloat(amount).toFixed(2)}</p>
          </div>
        </div>
        <PaymentElement />
        <Button 
          className="w-full" 
          type="submit" 
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${parseFloat(amount).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

interface InvoiceResponse {
  invoice: Invoice;
  client: Client;
  lineItems: LineItem[];
}

interface PaymentPageProps {
  id?: string;
}

export default function PaymentPage({ id }: PaymentPageProps) {
  const params = useParams();
  const invoiceId = id || params.id;
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  // Get invoice details
  const { data, isLoading, error } = useQuery<InvoiceResponse>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: !!invoiceId,
  });

  // Create payment intent
  const createPaymentIntent = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: number }) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", { invoiceId });
      return res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (data?.invoice?.id && !clientSecret) {
      createPaymentIntent.mutate({ invoiceId: data.invoice.id });
    }
  }, [data, clientSecret]);

  if (isLoading || createPaymentIntent.isPending) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-semibold">Error loading invoice</h2>
        <p className="text-gray-500">Unable to load invoice details</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const { invoice, client } = data;

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment for Invoice #{invoice.invoiceNumber}</CardTitle>
          <CardDescription>
            Complete your payment to {client.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              clientSecret={clientSecret}
              invoiceNumber={invoice.invoiceNumber}
              amount={invoice.total}
            />
          </Elements>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}