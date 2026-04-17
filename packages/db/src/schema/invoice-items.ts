import { integer, pgTable, real, serial, text } from "drizzle-orm/pg-core";
import { invoices } from "./invoices.js";
import { products } from "./products.js";

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: serial("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  notes: text("notes"),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});
