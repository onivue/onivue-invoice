import { authClient } from "@/lib/auth-client";
import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account")({
  component: AccountPage,
});

function AccountPage() {
  const queryClient = useQueryClient();
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: passkeys = [], isLoading } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });

  const addPasskey = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) throw new Error(result.error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast.success("Passkey hinzugefügt");
    },
    onError: (e: Error) => toast.error(e.message ?? "Passkey konnte nicht hinzugefügt werden"),
    onSettled: () => setAddingPasskey(false),
  });

  const renamePasskey = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const result = await authClient.passkey.updatePasskey({ id, name });
      if (result?.error) throw new Error(result.error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast.success("Passkey umbenannt");
      setRenameId(null);
    },
    onError: (e: Error) => toast.error(e.message ?? "Umbenennen fehlgeschlagen"),
  });

  const deletePasskey = useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result?.error) throw new Error(result.error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast.success("Passkey gelöscht");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message ?? "Löschen fehlgeschlagen"),
  });

  function startAdd() {
    setAddingPasskey(true);
    addPasskey.mutate();
  }

  function startRename(id: string, currentName: string) {
    setRenameId(id);
    setRenameName(currentName);
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Account</PageTitle>
      </PageHeader>
      <PageContent>
        <Card>
          <CardHeader className="pt-4 flex flex-row items-center justify-between">
            <CardTitle>Passkeys</CardTitle>
            <Button
              size="sm"
              onClick={startAdd}
              disabled={addingPasskey || addPasskey.isPending}
            >
              <KeyRound className="size-3.5 mr-1.5" />
              {addingPasskey || addPasskey.isPending ? "Wird hinzugefügt…" : "Neuer Passkey"}
            </Button>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Wird geladen…</p>
            ) : passkeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Passkeys registriert. Füge einen hinzu um dich ohne Passwort anzumelden.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {passkeys.map((pk) => (
                  <li key={pk.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col min-w-0">
                      {renameId === pk.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renamePasskey.mutate({ id: pk.id, name: renameName });
                              if (e.key === "Escape") setRenameId(null);
                            }}
                            className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-foreground/20 min-w-0 w-full"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => renamePasskey.mutate({ id: pk.id, name: renameName })}
                            disabled={renamePasskey.isPending}
                          >
                            OK
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRenameId(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium truncate">{pk.name || "Unbenannter Passkey"}</span>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground capitalize">{pk.deviceType}</span>
                        {pk.backedUp && (
                          <span className="text-xs text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                            Gesichert
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(pk.createdAt).toLocaleDateString("de-CH")}
                        </span>
                      </div>
                    </div>

                    {renameId !== pk.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        {deleteId === pk.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePasskey.mutate(pk.id)}
                              disabled={deletePasskey.isPending}
                            >
                              {deletePasskey.isPending ? "…" : "Löschen"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)}>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={() => startRename(pk.id, pk.name ?? "")}
                              title="Umbenennen"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(pk.id)}
                              title="Löschen"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
