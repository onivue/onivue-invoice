import { products } from "@onivue-invoice/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { router, workspaceProcedure } from "../index.js";

const productInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  defaultPrice: z.number().min(0),
  unit: z.enum(["Stk", "Std", "Pauschal"]),
});

export const productsRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(products)
      .where(eq(products.workspaceId, ctx.workspaceId))
      .orderBy(desc(products.createdAt));
  }),

  byId: workspaceProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select()
      .from(products)
      .where(eq(products.id, input.id));
    const product = result[0] ?? null;
    if (product && product.workspaceId !== ctx.workspaceId) return null;
    return product;
  }),

  create: workspaceProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.db
      .insert(products)
      .values({ ...input, workspaceId: ctx.workspaceId })
      .returning();
    return result[0]!;
  }),

  update: workspaceProcedure
    .input(z.object({ id: z.number(), data: productInput }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(products).set(input.data).where(eq(products.id, input.id));
      const result = await ctx.db.select().from(products).where(eq(products.id, input.id));
      return result[0]!;
    }),

  delete: workspaceProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(products).where(eq(products.id, input.id));
    return { success: true };
  }),
});
