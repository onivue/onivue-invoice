import { settings } from "@onivue-invoice/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { router, workspaceProcedure } from "../index.js";

const settingsInput = z.object({
  senderName: z.string().min(1),
  senderCompany: z.string().optional(),
  senderAddress: z.string().min(1),
  senderZip: z.string().min(1),
  senderCity: z.string().min(1),
  senderCountry: z.string().default("CH"),
  senderEmail: z.string().optional(),
  senderPhone: z.string().optional(),
  qrIban: z.string().min(1).transform((v) => v.replace(/[^A-Z0-9]/gi, "").toUpperCase()),
  defaultPaymentTermDays: z.number().int().min(1).default(30),
  logoPath: z.string().optional(),
  invoicePrefix: z.string().default("INV"),
  vatRate: z.number().min(0).max(100).nullable().optional(),
});

export const settingsRouter = router({
  get: workspaceProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select()
      .from(settings)
      .where(eq(settings.workspaceId, ctx.workspaceId));
    return result[0] ?? null;
  }),

  upsert: workspaceProcedure.input(settingsInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(settings)
      .where(eq(settings.workspaceId, ctx.workspaceId));
    if (existing.length > 0) {
      await ctx.db
        .update(settings)
        .set(input)
        .where(eq(settings.workspaceId, ctx.workspaceId));
    } else {
      await ctx.db.insert(settings).values({ workspaceId: ctx.workspaceId, ...input });
    }
    const result = await ctx.db
      .select()
      .from(settings)
      .where(eq(settings.workspaceId, ctx.workspaceId));
    return result[0]!;
  }),
});
