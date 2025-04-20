import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  invoices, type Invoice, type InsertInvoice,
  lineItems, type LineItem, type InsertLineItem,
  InvoiceStatus, type DashboardStats
} from "@shared/schema";

// extend the storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClientsByUserId(userId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Line item methods
  getLineItemsByInvoiceId(invoiceId: number): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: number, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: number): Promise<boolean>;
  deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean>;
  
  // Dashboard methods
  getDashboardStats(userId: number): Promise<DashboardStats>;
  
  // Next invoice number
  generateInvoiceNumber(): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private invoices: Map<number, Invoice>;
  private lineItems: Map<number, LineItem>;
  private currentUserId: number;
  private currentClientId: number;
  private currentInvoiceId: number;
  private currentLineItemId: number;
  private currentInvoiceNumber: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentInvoiceId = 1;
    this.currentLineItemId = 1;
    this.currentInvoiceNumber = 1;
    
    // Initialize with a sample user
    const sampleUser: User = {
      id: 1,
      username: "samwilson",
      password: "password123", // In a real app, this would be hashed
      fullName: "Sam Wilson",
      email: "sam@example.com",
      address: "123 Main St, San Francisco, CA 94101",
      phone: "415-555-1234",
      companyName: "Sam Wilson Freelance",
      companyLogo: null,
    };
    this.users.set(1, sampleUser);
    
    // Initialize with sample clients
    const sampleClients: Client[] = [
      {
        id: 1,
        userId: 1,
        name: "Acme Corp",
        email: "contact@acmecorp.com",
        address: "100 Market St, San Francisco, CA 94103",
        phone: "415-555-2345",
        companyName: "Acme Corporation",
        contactPerson: "John Doe",
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        name: "Stark Industries",
        email: "info@stark.com",
        address: "200 Park Ave, New York, NY 10166",
        phone: "212-555-3456",
        companyName: "Stark Industries",
        contactPerson: "Tony Stark",
        createdAt: new Date(),
      },
      {
        id: 3,
        userId: 1,
        name: "Wayne Enterprises",
        email: "info@wayne.com",
        address: "1 Wayne Tower, Gotham City",
        phone: "201-555-4567",
        companyName: "Wayne Enterprises",
        contactPerson: "Bruce Wayne",
        createdAt: new Date(),
      },
      {
        id: 4,
        userId: 1,
        name: "Pied Piper",
        email: "contact@piedpiper.com",
        address: "5230 Newell Road, Palo Alto, CA 94303",
        phone: "650-555-5678",
        companyName: "Pied Piper",
        contactPerson: "Richard Hendricks",
        createdAt: new Date(),
      }
    ];
    
    sampleClients.forEach(client => {
      this.clients.set(client.id, client);
      this.currentClientId = Math.max(this.currentClientId, client.id + 1);
    });
    
    // Initialize with sample invoices and line items
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    const sampleInvoices: Invoice[] = [
      {
        id: 1,
        userId: 1,
        clientId: 1,
        invoiceNumber: "INV-2023-041",
        status: InvoiceStatus.PAID,
        issueDate: new Date(2023, 2, 14), // March 14, 2023
        dueDate: new Date(2023, 3, 14), // April 14, 2023
        paymentTerms: "net_30",
        subtotal: 2400,
        taxRate: 0,
        taxAmount: 0,
        total: 2400,
        notes: "Thank you for your business!",
        createdAt: new Date(2023, 2, 14),
        updatedAt: new Date(2023, 2, 14),
      },
      {
        id: 2,
        userId: 1,
        clientId: 2,
        invoiceNumber: "INV-2023-040",
        status: InvoiceStatus.PENDING,
        issueDate: new Date(2023, 2, 10), // March 10, 2023
        dueDate: new Date(2023, 3, 10), // April 10, 2023
        paymentTerms: "net_30",
        subtotal: 1750,
        taxRate: 0,
        taxAmount: 0,
        total: 1750,
        notes: "",
        createdAt: new Date(2023, 2, 10),
        updatedAt: new Date(2023, 2, 10),
      },
      {
        id: 3,
        userId: 1,
        clientId: 3,
        invoiceNumber: "INV-2023-039",
        status: InvoiceStatus.OVERDUE,
        issueDate: new Date(2023, 2, 5), // March 5, 2023
        dueDate: new Date(2023, 3, 5), // April 5, 2023
        paymentTerms: "net_30",
        subtotal: 3200,
        taxRate: 0,
        taxAmount: 0,
        total: 3200,
        notes: "",
        createdAt: new Date(2023, 2, 5),
        updatedAt: new Date(2023, 2, 5),
      },
      {
        id: 4,
        userId: 1,
        clientId: 4,
        invoiceNumber: "INV-2023-038",
        status: InvoiceStatus.PAID,
        issueDate: new Date(2023, 1, 28), // Feb 28, 2023
        dueDate: new Date(2023, 2, 28), // March 28, 2023
        paymentTerms: "net_30",
        subtotal: 950,
        taxRate: 0,
        taxAmount: 0,
        total: 950,
        notes: "",
        createdAt: new Date(2023, 1, 28),
        updatedAt: new Date(2023, 1, 28),
      }
    ];
    
    sampleInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
      this.currentInvoiceId = Math.max(this.currentInvoiceId, invoice.id + 1);
    });
    
    this.currentInvoiceNumber = 42; // Next invoice number will be INV-2023-042
    
    // Sample line items
    const sampleLineItems: LineItem[] = [
      {
        id: 1,
        invoiceId: 1,
        description: "Web Design Services",
        quantity: 20,
        rate: 120,
        amount: 2400,
      },
      {
        id: 2,
        invoiceId: 2,
        description: "UI/UX Consulting",
        quantity: 10,
        rate: 175,
        amount: 1750,
      },
      {
        id: 3,
        invoiceId: 3,
        description: "Mobile App Development",
        quantity: 40,
        rate: 80,
        amount: 3200,
      },
      {
        id: 4,
        invoiceId: 4,
        description: "Logo Design",
        quantity: 1,
        rate: 950,
        amount: 950,
      }
    ];
    
    sampleLineItems.forEach(lineItem => {
      this.lineItems.set(lineItem.id, lineItem);
      this.currentLineItemId = Math.max(this.currentLineItemId, lineItem.id + 1);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByUserId(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId,
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const newClient: Client = { ...client, id, createdAt: new Date() };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient = { ...existingClient, ...client };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.userId === userId,
    );
  }

  async getInvoicesByClientId(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId,
    );
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const newInvoice: Invoice = { 
      ...invoice, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice: Invoice = { 
      ...existingInvoice, 
      ...invoice, 
      updatedAt: new Date() 
    };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice: Invoice = { 
      ...existingInvoice, 
      status, 
      updatedAt: new Date() 
    };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Delete all line items for this invoice first
    await this.deleteLineItemsByInvoiceId(id);
    return this.invoices.delete(id);
  }

  // Line item methods
  async getLineItemsByInvoiceId(invoiceId: number): Promise<LineItem[]> {
    return Array.from(this.lineItems.values()).filter(
      (lineItem) => lineItem.invoiceId === invoiceId,
    );
  }

  async createLineItem(lineItem: InsertLineItem): Promise<LineItem> {
    const id = this.currentLineItemId++;
    const newLineItem: LineItem = { ...lineItem, id };
    this.lineItems.set(id, newLineItem);
    return newLineItem;
  }

  async updateLineItem(id: number, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined> {
    const existingLineItem = this.lineItems.get(id);
    if (!existingLineItem) return undefined;
    
    const updatedLineItem = { ...existingLineItem, ...lineItem };
    this.lineItems.set(id, updatedLineItem);
    return updatedLineItem;
  }

  async deleteLineItem(id: number): Promise<boolean> {
    return this.lineItems.delete(id);
  }

  async deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean> {
    const lineItemsToDelete = Array.from(this.lineItems.values()).filter(
      (lineItem) => lineItem.invoiceId === invoiceId,
    );
    
    lineItemsToDelete.forEach(item => {
      this.lineItems.delete(item.id);
    });
    
    return true;
  }

  // Dashboard methods
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    
    const totalInvoices = userInvoices.length;
    
    const pendingPayment = userInvoices.filter(
      invoice => invoice.status === InvoiceStatus.PENDING
    ).length;
    
    const paid = userInvoices.filter(
      invoice => invoice.status === InvoiceStatus.PAID
    ).length;
    
    const totalRevenue = userInvoices
      .filter(invoice => invoice.status === InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    return {
      invoicesIssued: totalInvoices,
      pendingPayment,
      paid,
      totalRevenue,
    };
  }

  // Generate invoice number
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(this.currentInvoiceNumber++).padStart(3, '0')}`;
    return invoiceNumber;
  }
}

export const storage = new MemStorage();
