import { pgEnum, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers.js";

export const invoiceStatusEnum = pgEnum("invoice_status", ["created", "sent", "paid"]);

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  number: text("number").notNull().unique(),
  date: text("date").notNull(),
  dueDate: text("due_date").notNull(),
  customerId: serial("customer_id")
    .notNull()
    .references(() => customers.id),
  status: invoiceStatusEnum("status").notNull().default("created"),
  qrReference: text("qr_reference"),
  notes: text("notes"),
  total: real("total").notNull(),
  vatRate: real("vat_rate"),
  shareToken: text("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
