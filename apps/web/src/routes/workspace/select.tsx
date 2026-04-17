import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Building2, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/workspace/select")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: WorkspaceSelectPage,
});

function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const result = await authClient.$fetch<Array<{ id: string; name: string; slug: string }>>(
        "/organization/list",
        { method: "GET" },
      );
      return result.data ?? [];
    },
  });

  async function handleSelect(orgId: string) {
    setLoadingId(orgId);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      await navigate({ to: "/invoices" });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Building2 className="size-6 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Workspace auswählen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wähle einen Workspace aus oder erstelle einen neuen.
          </p>
        </div>

        <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden mb-4">
          {isLoading && (
            <p className="text-xs text-muted-foreground px-4 py-3">Lade Workspaces…</p>
          )}
          {orgs?.map((org) => (
            <button
              key={org.id}
              type="button"
              disabled={loadingId === org.id}
              onClick={() => handleSelect(org.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors disabled:opacity-50 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-foreground/10 flex items-center justify-center text-xs font-bold uppercase">
                  {org.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{org.name}</span>
              </div>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </button>
          ))}
          {!isLoading && !orgs?.length && (
            <p className="text-xs text-muted-foreground px-4 py-3">Keine Workspaces gefunden.</p>
          )}
        </div>

        <Link
          to="/workspace/new"
          className="flex items-center justify-center gap-2 w-full border border-border rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          <PlusIcon className="size-4" />
          Neuen Workspace erstellen
        </Link>
      </div>
    </div>
  );
}
