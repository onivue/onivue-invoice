import type { AppRouter } from "@onivue-invoice/api/routers/index";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import Loader from "./components/loader";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const trpcBaseUrl =
  typeof window !== "undefined"
    ? "/api/trpc"
    : `http://localhost:${process.env["PORT"] ?? 3000}/api/trpc`;

// On the server (SSR/loaders), forward the incoming request cookies so the
// tRPC handler can read the session. On the client, cookies are sent automatically.
const getRequestCookie = createIsomorphicFn()
  .client(async (): Promise<string | undefined> => undefined)
  .server(async (): Promise<string | undefined> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    return getRequest()?.headers.get("cookie") ?? undefined;
  });

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcBaseUrl,
      headers: async () => {
        const cookie = await getRequestCookie();
        return cookie ? { cookie } : {};
      },
    }),
  ],
});

const trpc = createTRPCOptionsProxy({
  client: trpcClient,
  queryClient: queryClient,
});

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { trpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    ),
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
