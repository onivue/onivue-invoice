import { customers, db as dbInstance, invoiceItems, invoices, settings } from "@onivue-invoice/db";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router, workspaceProcedure } from "../index.js";
import { buildQrReference } from "../utils.js";

const itemInput = z.object({
  productId: z.number().optional(),
  description: z.string().min(1),
  notes: z.string().optional().nullable(),
  quantity: z
    .number()
    .min(0)
    .refine((v) => Math.round(v * 10) === v * 10, "max 1 decimal"),
  unitPrice: z.number().int().min(0),
  total: z.number().min(0),
  sortOrder: z.number().default(0),
});

const invoiceInput = z.object({
  date: z.string().min(1),
  dueDate: z.string().min(1),
  customerId: z.number(),
  notes: z.string().optional().nullable(),
  total: z.number().min(0),
  vatRate: z.number().min(0).max(100).nullable().optional(),
  items: z.array(itemInput).min(1),
});

async function resolveNextInvoiceNumber(
  db: typeof dbInstance,
  workspaceId: string,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefixYear = `${prefix}${year}`;
  const existing = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(and(eq(invoices.workspaceId, workspaceId), like(invoices.number, `${prefixYear}%`)))
    .orderBy(desc(invoices.number))
    .limit(1);

  const last = existing[0];
  if (!last) {
    return `${prefixYear}001`;
  }

  const lastSeq = parseInt(last.number.slice(prefixYear.length), 10);
  return `${prefixYear}${(lastSeq + 1).toString().padStart(3, "0")}`;
}

export const invoicesRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: invoices.id,
        number: invoices.number,
        date: invoices.date,
        dueDate: invoices.dueDate,
        status: invoices.status,
        total: invoices.total,
        qrReference: invoices.qrReference,
        shareToken: invoices.shareToken,
        createdAt: invoices.createdAt,
        customerName: customers.name,
        customerCompany: customers.company,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.workspaceId, ctx.workspaceId))
      .orderBy(desc(invoices.createdAt));
    return rows;
  }),

  byId: workspaceProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const invoiceRows = await ctx.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, input.id));
    if (!invoiceRows[0] || invoiceRows[0].workspaceId !== ctx.workspaceId) return null;

    const invoice = invoiceRows[0];
    const customerRows = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, invoice.customerId));
    const items = await ctx.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, input.id))
      .orderBy(invoiceItems.sortOrder);

    return { ...invoice, customer: customerRows[0] ?? null, items };
  }),

  // Public endpoint: fetch invoice by share token (no auth required)
  byShareToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invoiceRows = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.shareToken, input.token));
      if (!invoiceRows[0]) return null;

      const invoice = invoiceRows[0];
      const customerRows = await ctx.db
        .select()
        .from(customers)
        .where(eq(customers.id, invoice.customerId));
      const items = await ctx.db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id))
        .orderBy(invoiceItems.sortOrder);

      return { ...invoice, customer: customerRows[0] ?? null, items };
    }),

  create: workspaceProcedure.input(invoiceInput).mutation(async ({ ctx, input }) => {
    const settingsRow = await ctx.db
      .select({ invoicePrefix: settings.invoicePrefix })
      .from(settings)
      .where(eq(settings.workspaceId, ctx.workspaceId));
    const prefix = settingsRow[0]?.invoicePrefix ?? "INV";
    const number = await resolveNextInvoiceNumber(ctx.db, ctx.workspaceId, prefix);

    const [invoice] = await ctx.db
      .insert(invoices)
      .values({
        number,
        workspaceId: ctx.workspaceId,
        date: input.date,
        dueDate: input.dueDate,
        customerId: input.customerId,
        notes: input.notes?.trim() || null,
        total: input.total,
        vatRate: input.vatRate ?? null,
        status: "created",
      })
      .returning();

    if (invoice) {
      const qrReference = buildQrReference(invoice.id);
      await ctx.db.update(invoices).set({ qrReference }).where(eq(invoices.id, invoice.id));
      invoice.qrReference = qrReference;
    }

    if (!invoice) throw new Error("invoice creation failed");

    await ctx.db.insert(invoiceItems).values(
      input.items.map((item, i) => ({
        invoiceId: invoice.id,
        productId: item.productId,
        description: item.description,
        notes: item.notes?.trim() || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        sortOrder: item.sortOrder ?? i,
      })),
    );

    return invoice;
  }),

  update: workspaceProcedure
    .input(z.object({ id: z.number(), data: invoiceInput }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ status: invoices.status, workspaceId: invoices.workspaceId })
        .from(invoices)
        .where(eq(invoices.id, input.id));
      if (!existing[0] || existing[0].workspaceId !== ctx.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (existing[0].status !== "created") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Gesperrte Rechnung kann nicht bearbeitet werden",
        });
      }

      await ctx.db
        .update(invoices)
        .set({
          date: input.data.date,
          dueDate: input.data.dueDate,
          customerId: input.data.customerId,
          notes: input.data.notes?.trim() || null,
          total: input.data.total,
          vatRate: input.data.vatRate ?? null,
        })
        .where(eq(invoices.id, input.id));

      await ctx.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, input.id));
      await ctx.db.insert(invoiceItems).values(
        input.data.items.map((item, i) => ({
          invoiceId: input.id,
          productId: item.productId,
          description: item.description,
          notes: item.notes?.trim() || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder ?? i,
        })),
      );

      const result = await ctx.db.select().from(invoices).where(eq(invoices.id, input.id));
      return result[0]!;
    }),

  duplicate: workspaceProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sourceRows = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id));
      if (!sourceRows[0] || sourceRows[0].workspaceId !== ctx.workspaceId) {
        throw new Error("invoice not found");
      }
      const source = sourceRows[0];

      const sourceItems = await ctx.db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.id))
        .orderBy(invoiceItems.sortOrder);

      const settingsRow = await ctx.db
        .select({ invoicePrefix: settings.invoicePrefix, defaultPaymentTermDays: settings.defaultPaymentTermDays })
        .from(settings)
        .where(eq(settings.workspaceId, ctx.workspaceId));
      const prefix = settingsRow[0]?.invoicePrefix ?? "INV";
      const number = await resolveNextInvoiceNumber(ctx.db, ctx.workspaceId, prefix);

      const today = new Date().toISOString().slice(0, 10);
      const daysOut = settingsRow[0]?.defaultPaymentTermDays ?? 30;
      const dueDate = new Date(Date.now() + daysOut * 86400000).toISOString().slice(0, 10);

      const [copy] = await ctx.db
        .insert(invoices)
        .values({
          number,
          workspaceId: ctx.workspaceId,
          date: today,
          dueDate,
          customerId: source.customerId,
          notes: source.notes,
          total: source.total,
          vatRate: source.vatRate,
          status: "created",
        })
        .returning();

      if (!copy) throw new Error("duplicate failed");

      const qrReference = buildQrReference(copy.id);
      await ctx.db.update(invoices).set({ qrReference }).where(eq(invoices.id, copy.id));
      copy.qrReference = qrReference;

      if (sourceItems.length > 0) {
        await ctx.db.insert(invoiceItems).values(
          sourceItems.map((item) => ({
            invoiceId: copy.id,
            productId: item.productId,
            description: item.description,
            notes: item.notes,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        );
      }

      return copy;
    }),

  updateStatus: workspaceProcedure
    .input(z.object({ id: z.number(), status: z.enum(["created", "sent", "paid"]) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ status: invoices.status, workspaceId: invoices.workspaceId })
        .from(invoices)
        .where(eq(invoices.id, input.id));
      if (!existing[0] || existing[0].workspaceId !== ctx.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const validTransitions: Record<string, string[]> = {
        created: ["sent"],
        sent: ["created", "paid"],
        paid: ["sent"],
      };
      if (!validTransitions[existing[0].status]?.includes(input.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiger Statuswechsel" });
      }

      await ctx.db
        .update(invoices)
        .set({ status: input.status })
        .where(eq(invoices.id, input.id));
      return { success: true };
    }),

  delete: workspaceProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(invoices).where(eq(invoices.id, input.id));
    return { success: true };
  }),

  generateShareToken: workspaceProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ workspaceId: invoices.workspaceId })
        .from(invoices)
        .where(eq(invoices.id, input.id));
      if (!existing[0] || existing[0].workspaceId !== ctx.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const token = crypto.randomUUID();
      await ctx.db
        .update(invoices)
        .set({ shareToken: token })
        .where(eq(invoices.id, input.id));
      return { token };
    }),

  revokeShareToken: workspaceProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ workspaceId: invoices.workspaceId })
        .from(invoices)
        .where(eq(invoices.id, input.id));
      if (!existing[0] || existing[0].workspaceId !== ctx.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db
        .update(invoices)
        .set({ shareToken: null })
        .where(eq(invoices.id, input.id));
      return { success: true };
    }),
});
