import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { OnboardingModal } from "@/components/modals/onboarding-modal";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Reads session on the server by forwarding the incoming request cookies directly
// to the auth layer — no HTTP round-trip, so cookies are always present.
const fetchSession = createServerFn().handler(async () => {
  const request = getRequest();
  if (!request) return null;
  return auth.api.getSession({ headers: request.headers });
});

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/login" });

    // activeOrganizationId is persisted in the session record after setActive(),
    // so it's available on reload without any extra fetch.
    const activeOrgId = (session.session as { activeOrganizationId?: string | null })
      .activeOrganizationId;

    if (!activeOrgId) {
      const { data: activeOrg } = await authClient.organization
        .getActiveMember()
        .catch(() => ({ data: null }));

      if (!activeOrg) {
        const { data: orgs } = await authClient
          .$fetch<Array<{ id: string; name: string; slug: string }>>("/organization/list", {
            method: "GET",
          })
          .catch(() => ({ data: [] }));
        const orgList = orgs ?? [];

        if (orgList.length === 0) {
          throw redirect({ to: "/workspace/new" });
        } else if (orgList.length === 1) {
          await authClient.organization.setActive({ organizationId: orgList[0].id });
        } else {
          throw redirect({ to: "/workspace/select" });
        }
      }
    }

    return { session };
  },
  loader: ({ context: { trpc, queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(trpc.settings.get.queryOptions()),
      queryClient.ensureQueryData(trpc.products.list.queryOptions()),
    ]),
  component: AppLayout,
});

function AppLayout() {
  const trpc = useTRPC();
  const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions());
  const { data: products } = useSuspenseQuery(trpc.products.list.queryOptions());

  const needsOnboarding =
    !settings?.senderName?.trim() ||
    !settings?.qrIban?.trim() ||
    (products?.length ?? 0) === 0;

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
      <OnboardingModal open={needsOnboarding} />
    </div>
  );
}
