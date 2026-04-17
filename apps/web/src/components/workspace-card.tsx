import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2Icon,
  CheckIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  owner: "Inhaber",
  admin: "Admin",
  member: "Mitglied",
};

export function WorkspaceCard() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [resendLoadingId, setResendLoadingId] = useState<string | null>(null);
  const [switchLoadingId, setSwitchLoadingId] = useState<string | null>(null);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceLoading, setNewWorkspaceLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: org, refetch: refetchOrg } = useQuery({
    queryKey: ["organization-full"],
    queryFn: async () => {
      const result = await authClient.organization.getFullOrganization();
      return result.data;
    },
  });

  const { data: allOrgs, refetch: refetchAllOrgs } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const result = await authClient.$fetch<Array<{ id: string; name: string; slug: string }>>(
        "/organization/list",
        { method: "GET" },
      );
      return result.data ?? [];
    },
  });

  const { data: invitations, refetch: refetchInvitations } = useQuery({
    queryKey: ["organization-invitations"],
    queryFn: async () => {
      const result = await authClient.organization.listInvitations();
      return (result.data ?? []).filter((inv) => inv.status === "pending");
    },
  });

  const myRole = org?.members?.find((m) => m.userId === session?.user.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const result = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim Einladen");
      } else {
        toast.success(`Einladung an ${inviteEmail} gesendet`);
        setInviteEmail("");
        void refetchInvitations();
      }
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemove(memberId: string) {
    setRemoveLoadingId(memberId);
    try {
      const result = await authClient.organization.removeMember({ memberIdOrEmail: memberId });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim Entfernen");
      } else {
        toast.success("Mitglied entfernt");
        void refetchOrg();
      }
    } finally {
      setRemoveLoadingId(null);
    }
  }

  async function handleRevoke(invitationId: string) {
    setRevokeLoadingId(invitationId);
    try {
      const result = await authClient.organization.cancelInvitation({ invitationId });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim Widerrufen");
      } else {
        toast.success("Einladung widerrufen");
        void refetchInvitations();
      }
    } finally {
      setRevokeLoadingId(null);
    }
  }

  async function handleResend(inv: { id: string; email: string; role: string }) {
    setResendLoadingId(inv.id);
    try {
      await authClient.organization.cancelInvitation({ invitationId: inv.id });
      const result = await authClient.organization.inviteMember({
        email: inv.email,
        role: inv.role as "member" | "admin",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim erneuten Senden");
      } else {
        toast.success(`Einladung erneut an ${inv.email} gesendet`);
        void refetchInvitations();
      }
    } finally {
      setResendLoadingId(null);
    }
  }

  async function handleSwitchWorkspace(orgId: string) {
    setSwitchLoadingId(orgId);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      await navigate({ to: "/invoices" });
    } finally {
      setSwitchLoadingId(null);
    }
  }

  async function handleDeleteWorkspace() {
    if (!org?.id) return;
    setDeleteLoading(true);
    try {
      const result = await authClient.organization.delete({ organizationId: org.id });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim Löschen");
      } else {
        toast.success(`Workspace "${org.name}" gelöscht`);
        setShowDeleteConfirm(false);
        await navigate({ to: "/workspace/select" });
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setNewWorkspaceLoading(true);
    try {
      const slug = newWorkspaceName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const result = await authClient.organization.create({
        name: newWorkspaceName.trim(),
        slug: `${slug}-${Date.now()}`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Fehler beim Erstellen");
        return;
      }
      if (result.data) {
        await authClient.organization.setActive({ organizationId: result.data.id });
      }
      toast.success(`Workspace "${newWorkspaceName.trim()}" erstellt`);
      setNewWorkspaceName("");
      setShowNewWorkspace(false);
      void refetchAllOrgs();
      void refetchOrg();
      void refetchInvitations();
      await navigate({ to: "/invoices" });
    } finally {
      setNewWorkspaceLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pt-4">
        <CardTitle>Workspace</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-4">
        {(allOrgs?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Workspaces</p>
            <div className="border border-border rounded-md overflow-hidden">
              {allOrgs?.map((ws) => {
                const isActive = ws.id === org?.id;
                return (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center text-[10px] font-bold uppercase">
                        {ws.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">{ws.name}</span>
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckIcon className="size-3" />
                        Aktiv
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={switchLoadingId === ws.id}
                        onClick={() => handleSwitchWorkspace(ws.id)}
                      >
                        Wechseln
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!showNewWorkspace ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewWorkspace(true)}
          >
            <PlusIcon className="size-3.5" />
            Neuen Workspace erstellen
          </Button>
        ) : (
          <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-2">
            <p className="text-xs font-medium">Neuer Workspace</p>
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="z.B. Muster GmbH"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={newWorkspaceLoading || !newWorkspaceName.trim()}
              >
                <Building2Icon className="size-3.5" />
                Erstellen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewWorkspace(false);
                  setNewWorkspaceName("");
                }}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        )}

        <div>
          <p className="text-xs font-medium mb-2">Mitglieder</p>
          <div className="border border-border rounded-md overflow-hidden">
            {org?.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-xs">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                  {canManage && member.userId !== session?.user.id && member.role !== "owner" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={removeLoadingId === member.id}
                      onClick={() => handleRemove(member.id)}
                      title="Mitglied entfernen"
                    >
                      <Trash2Icon className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!org?.members?.length && (
              <p className="text-xs text-muted-foreground px-3 py-2.5">Keine Mitglieder</p>
            )}
          </div>
        </div>

        {canManage && (invitations?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Ausstehende Einladungen</p>
            <div className="border border-border rounded-md overflow-hidden">
              {invitations?.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[inv.role ?? "member"] ?? inv.role} · läuft ab{" "}
                      {new Date(inv.expiresAt).toLocaleDateString("de-CH")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={resendLoadingId === inv.id}
                      onClick={() => handleResend(inv)}
                      title="Erneut senden"
                    >
                      <RefreshCwIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={revokeLoadingId === inv.id}
                      onClick={() => handleRevoke(inv.id)}
                      title="Einladung widerrufen"
                    >
                      <XIcon className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canManage && (
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <p className="text-xs font-medium">Mitglied einladen</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@beispiel.ch"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-foreground/20"
              >
                <option value="member">Mitglied</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" disabled={inviteLoading || !inviteEmail}>
                <UserPlusIcon className="size-3.5" />
                Einladen
              </Button>
            </div>
          </form>
        )}

        {myRole === "owner" && (
          <>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium mb-2">Gefahrenzone</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2Icon className="size-3.5" />
                Workspace löschen
              </Button>
            </div>
            <ConfirmDialog
              open={showDeleteConfirm}
              onOpenChange={setShowDeleteConfirm}
              title={`Workspace "${org?.name}" löschen?`}
              description="Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten dieses Workspaces werden dauerhaft gelöscht."
              confirmLabel="Endgültig löschen"
              isPending={deleteLoading}
              onConfirm={handleDeleteWorkspace}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
