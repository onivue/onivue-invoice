import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/workspace/new")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: WorkspaceNewPage,
});

function WorkspaceNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bitte einen Workspace-Namen eingeben");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const result = await authClient.organization.create({
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
      });
      if (result.error) {
        setError(result.error.message ?? "Fehler beim Erstellen");
        return;
      }
      if (result.data) {
        await authClient.organization.setActive({ organizationId: result.data.id });
      }
      await navigate({ to: "/invoices" });
    } catch {
      setError("Workspace konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Building2 className="size-6 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Workspace erstellen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gib deiner Firma oder deinem Team einen Namen.
          </p>
        </div>

        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Workspace-Name</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Muster GmbH"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Wird erstellt…" : "Workspace erstellen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
