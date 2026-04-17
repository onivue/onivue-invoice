import { Toaster } from "@/components/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import appCss from "../index.css?url";

import type { AppRouter } from "@onivue-invoice/api/routers/index";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Onivue Invoice" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster richColors />
        {/* <TanStackRouterDevtools position="bottom-left" /> */}
        {/* <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" /> */}
        <Scripts />
      </body>
    </html>
  );
}
