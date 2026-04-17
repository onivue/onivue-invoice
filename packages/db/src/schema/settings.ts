import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  workspaceId: text("workspace_id").primaryKey(),
  senderName: text("sender_name").notNull(),
  senderCompany: text("sender_company"),
  senderAddress: text("sender_address").notNull(),
  senderZip: text("sender_zip").notNull(),
  senderCity: text("sender_city").notNull(),
  senderCountry: text("sender_country").default("CH").notNull(),
  senderEmail: text("sender_email"),
  senderPhone: text("sender_phone"),
  qrIban: text("qr_iban").notNull(),
  defaultPaymentTermDays: integer("default_payment_term_days").default(30).notNull(),
  logoPath: text("logo_path"),
  invoicePrefix: text("invoice_prefix").default("INV").notNull(),
  vatRate: real("vat_rate"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
