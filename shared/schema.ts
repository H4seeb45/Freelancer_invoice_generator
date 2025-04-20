import { pgTable, text, serial, integer, boolean, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  phone: text("phone"),
  companyName: text("company_name"),
  companyLogo: text("company_logo"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  address: true,
  phone: true,
  companyName: true,
  companyLogo: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  address: text("address"),
  phone: text("phone"),
  companyName: text("company_name"),
  contactPerson: text("contact_person"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  userId: true,
  name: true,
  email: true,
  address: true,
  phone: true,
  companyName: true,
  contactPerson: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Invoice status enum
export const InvoiceStatus = {
  DRAFT: "draft",
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// Invoice schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientId: integer("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default(InvoiceStatus.DRAFT),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  userId: true,
  clientId: true,
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  paymentTerms: true,
  subtotal: true,
  taxRate: true,
  taxAmount: true,
  total: true,
  notes: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice line item schema
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertLineItemSchema = createInsertSchema(lineItems).pick({
  invoiceId: true,
  description: true,
  quantity: true,
  rate: true,
  amount: true,
});

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

// Extended schema for creating an invoice with line items
export const createInvoiceSchema = z.object({
  invoice: insertInvoiceSchema,
  lineItems: z.array(insertLineItemSchema.omit({ invoiceId: true })),
});

export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;

// Form input schemas
export const clientFormSchema = insertClientSchema.omit({ userId: true });
export type ClientFormData = z.infer<typeof clientFormSchema>;

export const invoiceFormSchema = z.object({
  clientId: z.number(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  paymentTerms: z.string(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(0.01, "Quantity must be greater than 0"),
      rate: z.number().min(0, "Rate cannot be negative"),
      amount: z.number()
    })
  ).min(1, "At least one line item is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

// Dashboard statistics type
export type DashboardStats = {
  invoicesIssued: number;
  pendingPayment: number;
  paid: number;
  totalRevenue: number;
};
