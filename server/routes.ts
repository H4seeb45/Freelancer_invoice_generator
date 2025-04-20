import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createInvoiceSchema, 
  clientFormSchema, 
  invoiceFormSchema,
  insertClientSchema,
  insertInvoiceSchema,
  insertLineItemSchema,
  InvoiceStatus
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import Stripe from "stripe";

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  });
  
  // Prefix all routes with /api
  const apiRouter = express.Router();
  app.use('/api', apiRouter);

  // Current user is now handled by the auth module
  
  // Dashboard stats - requires authentication
  apiRouter.get('/dashboard/stats', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    try {
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Client routes - requires authentication
  apiRouter.get('/clients', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    try {
      const clients = await storage.getClientsByUserId(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients' });
    }
  });

  apiRouter.get('/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const client = await storage.getClient(Number(id));
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      // Ensure the client belongs to the logged-in user
      if (client.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Unauthorized access to this client' });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client' });
    }
  });

  apiRouter.post('/clients', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      const validatedData = clientFormSchema.parse(req.body);
      const clientData = { ...validatedData, userId };
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to create client' });
    }
  });

  apiRouter.put('/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    try {
      // First check if the client exists and belongs to the user
      const existingClient = await storage.getClient(Number(id));
      if (!existingClient) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      if (existingClient.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this client' });
      }
      
      const validatedData = clientFormSchema.parse(req.body);
      const client = await storage.updateClient(Number(id), validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to update client' });
    }
  });

  apiRouter.delete('/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    try {
      // First check if the client exists and belongs to the user
      const existingClient = await storage.getClient(Number(id));
      if (!existingClient) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      if (existingClient.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this client' });
      }
      
      const success = await storage.deleteClient(Number(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete client' });
    }
  });

  // Invoice routes - requires authentication
  apiRouter.get('/invoices', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    try {
      const invoices = await storage.getInvoicesByUserId(userId);
      
      // For each invoice, get the client to include in the response
      const invoicesWithClient = await Promise.all(invoices.map(async (invoice) => {
        const client = await storage.getClient(invoice.clientId);
        return {
          ...invoice,
          client
        };
      }));
      
      res.json(invoicesWithClient);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // Generate next invoice number
  apiRouter.get('/invoices/next-number', isAuthenticated, async (_req: Request, res: Response) => {
    try {
      const invoiceNumber = await storage.generateInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate invoice number' });
    }
  });

  apiRouter.get('/invoices/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    try {
      const invoice = await storage.getInvoice(Number(id));
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Ensure the invoice belongs to the logged-in user
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this invoice' });
      }
      
      // Get the client
      const client = await storage.getClient(invoice.clientId);
      
      // Get the line items
      const lineItems = await storage.getLineItemsByInvoiceId(invoice.id);
      
      res.json({
        invoice,
        client,
        lineItems
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  apiRouter.post('/invoices', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    try {
      // Validate form data
      const validatedData = invoiceFormSchema.parse(req.body);
      
      // Verify client belongs to user
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this client' });
      }
      
      // Prepare invoice data
      const subtotal = validatedData.lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxAmount = (subtotal * validatedData.taxRate) / 100;
      const total = subtotal + taxAmount;
      
      const invoiceData = {
        userId,
        clientId: validatedData.clientId,
        invoiceNumber: validatedData.invoiceNumber,
        status: InvoiceStatus.PENDING, // Start as pending
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        paymentTerms: validatedData.paymentTerms,
        notes: validatedData.notes || "",
        
        // Convert to strings to match schema
        subtotal: subtotal.toString(),
        taxRate: validatedData.taxRate.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
      };
      
      // Create the invoice
      const invoice = await storage.createInvoice(invoiceData);
      
      // Create line items
      const lineItems = await Promise.all(
        validatedData.lineItems.map(item => 
          storage.createLineItem({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
            amount: item.amount.toString()
          })
        )
      );
      
      res.status(201).json({ invoice, lineItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error(error);
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  apiRouter.put('/invoices/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    try {
      // Validate form data
      const validatedData = invoiceFormSchema.parse(req.body);
      
      // First check if the invoice exists and belongs to the user
      const existingInvoice = await storage.getInvoice(Number(id));
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (existingInvoice.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this invoice' });
      }
      
      // Verify client belongs to user
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this client' });
      }
      
      // Prepare invoice data
      const subtotal = validatedData.lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxAmount = (subtotal * validatedData.taxRate) / 100;
      const total = subtotal + taxAmount;
      
      const invoiceData = {
        clientId: validatedData.clientId,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        paymentTerms: validatedData.paymentTerms,
        notes: validatedData.notes || "",
        
        // Convert to strings to match schema
        subtotal: subtotal.toString(),
        taxRate: validatedData.taxRate.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
      };
      
      // Update the invoice
      const invoice = await storage.updateInvoice(Number(id), invoiceData);
      
      // Delete existing line items
      await storage.deleteLineItemsByInvoiceId(invoice!.id);
      
      // Create new line items
      const lineItems = await Promise.all(
        validatedData.lineItems.map(item => 
          storage.createLineItem({
            invoiceId: invoice!.id,
            description: item.description,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
            amount: item.amount.toString()
          })
        )
      );
      
      res.json({ invoice, lineItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  apiRouter.patch('/invoices/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;
    
    try {
      // First check if the invoice exists and belongs to the user
      const existingInvoice = await storage.getInvoice(Number(id));
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (existingInvoice.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this invoice' });
      }
      
      // Validate status
      if (!Object.values(InvoiceStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const invoice = await storage.updateInvoiceStatus(Number(id), status);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  });

  apiRouter.delete('/invoices/:id', isAuthenticated, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    try {
      // First check if the invoice exists and belongs to the user
      const existingInvoice = await storage.getInvoice(Number(id));
      if (!existingInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (existingInvoice.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this invoice' });
      }
      
      const success = await storage.deleteInvoice(Number(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  });

  // Stripe payment routes
  apiRouter.post('/create-payment-intent', isAuthenticated, async (req: Request, res: Response) => {
    const { invoiceId } = req.body;
    const userId = req.user!.id;
    
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }
    
    try {
      // Fetch the invoice
      const invoice = await storage.getInvoice(Number(invoiceId));
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Ensure the invoice belongs to the logged-in user
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to this invoice' });
      }
      
      // Create a payment intent with Stripe
      const amount = Math.round(parseFloat(invoice.total) * 100); // Convert to cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });
  
  // Webhook for Stripe events
  apiRouter.post('/stripe-webhook', async (req: Request, res: Response) => {
    // This endpoint would be used for receiving webhook events from Stripe
    // For production, you would need to verify the webhook signature
    
    res.status(200).json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
