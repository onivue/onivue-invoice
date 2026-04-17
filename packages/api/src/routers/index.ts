import { publicProcedure, router } from "../index.js";
import { customersRouter } from "./customers.js";
import { invoicesRouter } from "./invoices.js";
import { productsRouter } from "./products.js";
import { settingsRouter } from "./settings.js";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  settings: settingsRouter,
  customers: customersRouter,
  products: productsRouter,
  invoices: invoicesRouter,
});

export type AppRouter = typeof appRouter;
