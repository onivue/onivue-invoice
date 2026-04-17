import { customers } from "@onivue-invoice/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router, workspaceProcedure } from "../index.js";

const customerInput = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  address: z.string().min(1),
  zip: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default("CH"),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const customersRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(customers)
      .where(eq(customers.workspaceId, ctx.workspaceId))
      .orderBy(desc(customers.createdAt));
  }),

  byId: workspaceProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, input.id));
    const customer = result[0] ?? null;
    if (customer && customer.workspaceId !== ctx.workspaceId) return null;
    return customer;
  }),

  create: workspaceProcedure.input(customerInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.db
      .insert(customers)
      .values({ ...input, workspaceId: ctx.workspaceId })
      .returning();
    return result[0]!;
  }),

  update: workspaceProcedure
    .input(z.object({ id: z.number(), data: customerInput }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(customers)
        .set(input.data)
        .where(eq(customers.id, input.id));
      const result = await ctx.db
        .select()
        .from(customers)
        .where(eq(customers.id, input.id));
      return result[0]!;
    }),

  delete: workspaceProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(customers)
      .where(eq(customers.id, input.id));
    return { success: true };
  }),
});
