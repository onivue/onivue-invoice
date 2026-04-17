import { createContext } from "@onivue-invoice/api/context";
import { appRouter } from "@onivue-invoice/api/routers/index";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "../../../lib/auth";

async function handler({ request }: { request: Request }) {
  const session = await auth.api.getSession({ headers: request.headers });
  return fetchRequestHandler({
    req: request,
    router: appRouter,
    createContext: () => createContext({ session }),
    endpoint: "/api/trpc",
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
