import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTRPC } from "@/utils/trpc";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/")({
  loader: ({ context: { trpc, queryClient } }) =>
    queryClient.ensureQueryData(trpc.invoices.list.queryOptions()),
  pendingComponent: Loader,
  component: InvoicesListPage,
});

function formatDate(iso: string) {
  const p = iso.split("-");
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function InvoicesListPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: invoices } = useSuspenseQuery(trpc.invoices.list.queryOptions());
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [sendTarget, setSendTarget] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries(trpc.invoices.list.queryFilter());

  const duplicate = useMutation(
    trpc.invoices.duplicate.mutationOptions({
      onSuccess: (data) => {
        invalidate();
        toast.success("Rechnung dupliziert");
        navigate({ to: "/invoices/$id", params: { id: String(data.id) } });
      },
      onError: () => toast.error("Fehler beim Duplizieren"),
    }),
  );

  const updateStatus = useMutation(
    trpc.invoices.updateStatus.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Status aktualisiert");
      },
      onError: () => toast.error("Fehler beim Status ändern"),
    }),
  );

  const remove = useMutation(
    trpc.invoices.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        setDeleteTarget(null);
        toast.success("Rechnung gelöscht");
      },
      onError: () => toast.error("Fehler beim Löschen"),
    }),
  );

  return (
    <>
      <PageHeader>
        <PageTitle>Rechnungen</PageTitle>
        <Link to="/invoices/new">
          <Button size="sm">
            <PlusIcon className="size-3.5" />
            Neue Rechnung
          </Button>
        </Link>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-xs">
                Noch keine Rechnungen erstellt.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nr.</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Kunde
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Datum
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Fällig
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="w-32 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer"
                      onClick={() => navigate({ to: "/invoices/$id", params: { id: String(inv.id) } })}
                    >
                      <td className="px-4 py-2.5 font-medium font-mono">{inv.number}</td>
                      <td className="px-4 py-2.5">
                        {inv.customerCompany ? (
                          <>
                            <span className="font-medium">{inv.customerCompany}</span>
                            <br />
                            <span className="text-muted-foreground">{inv.customerName}</span>
                          </>
                        ) : (
                          inv.customerName
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(inv.date)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        CHF {inv.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={inv.status as "created" | "sent" | "paid"}>
                          {inv.status === "paid"
                            ? "Bezahlt"
                            : inv.status === "sent"
                              ? "Versendet"
                              : "Offen"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Link to="/invoices/$id" params={{ id: String(inv.id) }}>
                            <Button variant="ghost" size="icon-xs" aria-label="bearbeiten">
                              <PencilIcon className="size-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="PDF herunterladen"
                            onClick={() =>
                              window.open(
                                `/api/invoices/${inv.id}/pdf`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <DownloadIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="duplizieren"
                            onClick={() => duplicate.mutate({ id: inv.id })}
                          >
                            <CopyIcon className="size-3.5" />
                          </Button>
                          {inv.status === "created" && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="versenden"
                              onClick={() => setSendTarget(inv.id)}
                            >
                              <SendIcon className="size-3.5" />
                            </Button>
                          )}
                          {inv.status === "sent" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label="als bezahlt markieren"
                                onClick={() => updateStatus.mutate({ id: inv.id, status: "paid" })}
                              >
                                <CheckIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label="als offen markieren"
                                onClick={() =>
                                  updateStatus.mutate({ id: inv.id, status: "created" })
                                }
                              >
                                <RotateCcwIcon className="size-3.5" />
                              </Button>
                            </>
                          )}
                          {inv.status === "paid" && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="als versendet markieren"
                              onClick={() => updateStatus.mutate({ id: inv.id, status: "sent" })}
                            >
                              <RotateCcwIcon className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="löschen"
                            onClick={() => setDeleteTarget(inv.id)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>

      <ConfirmDialog
        open={sendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSendTarget(null);
        }}
        title="Rechnung versenden?"
        description="Nach dem Versenden kann die Rechnung nicht mehr bearbeitet werden."
        confirmLabel="Versenden"
        confirmVariant="default"
        isPending={updateStatus.isPending}
        onConfirm={() => {
          if (sendTarget !== null)
            updateStatus.mutate(
              { id: sendTarget, status: "sent" },
              { onSettled: () => setSendTarget(null) },
            );
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Rechnung löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        isPending={remove.isPending}
        onConfirm={() => {
          if (deleteTarget !== null) remove.mutate({ id: deleteTarget });
        }}
      />
    </>
  );
}
