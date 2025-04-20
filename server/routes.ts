import express, { type Express, Request, Response } from "express";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all routes with /api
  const apiRouter = express.Router();
  app.use('/api', apiRouter);

  // Get current user (for now, just return the sample user)
  apiRouter.get('/user', async (req: Request, res: Response) => {
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Dashboard stats
  apiRouter.get('/dashboard/stats', async (req: Request, res: Response) => {
    const userId = 1; // Using the sample user
    try {
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Client routes
  apiRouter.get('/clients', async (req: Request, res: Response) => {
    const userId = 1; // Using the sample user
    try {
      const clients = await storage.getClientsByUserId(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clients' });
    }
  });

  apiRouter.get('/clients/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const client = await storage.getClient(Number(id));
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client' });
    }
  });

  apiRouter.post('/clients', async (req: Request, res: Response) => {
    const userId = 1; // Using the sample user
    
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

  apiRouter.put('/clients/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const validatedData = clientFormSchema.parse(req.body);
      const client = await storage.updateClient(Number(id), validatedData);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to update client' });
    }
  });

  apiRouter.delete('/clients/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const success = await storage.deleteClient(Number(id));
      if (!success) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete client' });
    }
  });

  // Invoice routes
  apiRouter.get('/invoices', async (req: Request, res: Response) => {
    const userId = 1; // Using the sample user
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

  apiRouter.get('/invoices/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const invoice = await storage.getInvoice(Number(id));
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
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

  // Generate next invoice number
  apiRouter.get('/invoices/next-number', async (_req: Request, res: Response) => {
    try {
      const invoiceNumber = await storage.generateInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate invoice number' });
    }
  });

  apiRouter.post('/invoices', async (req: Request, res: Response) => {
    const userId = 1; // Using the sample user
    
    try {
      // Validate form data
      const validatedData = invoiceFormSchema.parse(req.body);
      
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

  apiRouter.put('/invoices/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Validate form data
      const validatedData = invoiceFormSchema.parse(req.body);
      
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
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Delete existing line items
      await storage.deleteLineItemsByInvoiceId(invoice.id);
      
      // Create new line items
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
      
      res.json({ invoice, lineItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  });

  apiRouter.patch('/invoices/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      // Validate status
      if (!Object.values(InvoiceStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const invoice = await storage.updateInvoiceStatus(Number(id), status);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update invoice status' });
    }
  });

  apiRouter.delete('/invoices/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const success = await storage.deleteInvoice(Number(id));
      if (!success) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
