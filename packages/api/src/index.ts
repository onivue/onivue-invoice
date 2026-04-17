import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "./context.js";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const workspaceProcedure = protectedProcedure.use(({ ctx, next }) => {
  const workspaceId = ctx.session.session.activeOrganizationId;
  if (!workspaceId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active workspace selected",
    });
  }
  return next({ ctx: { ...ctx, workspaceId } });
});
