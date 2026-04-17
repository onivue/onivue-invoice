import { InvoiceFormFields } from "@/components/forms/invoice-form-fields";
import type { LineItem } from "@/components/forms/invoice-form-fields";
import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTRPC } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  LinkIcon,
  LockIcon,
  RotateCcwIcon,
  SendIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/$id")({
  loader: async ({ context: { trpc, queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(trpc.invoices.byId.queryOptions({ id: parseInt(params.id) })),
      queryClient.ensureQueryData(trpc.customers.list.queryOptions()),
      queryClient.ensureQueryData(trpc.products.list.queryOptions()),
    ]);
  },
  pendingComponent: Loader,
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const invoiceId = parseInt(id);

  const { data: invoice } = useSuspenseQuery(trpc.invoices.byId.queryOptions({ id: invoiceId }));
  const { data: customers } = useSuspenseQuery(trpc.customers.list.queryOptions());
  const { data: products } = useSuspenseQuery(trpc.products.list.queryOptions());

  const isLocked = invoice?.status !== "created";

  const [items, setItems] = useState<LineItem[]>(
    invoice?.items.map((it) => ({
      productId: it.productId ?? undefined,
      description: it.description,
      notes: it.notes ?? "",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      sortOrder: it.sortOrder,
    })) ?? [{ description: "", notes: "", quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 }],
  );

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

  const grandTotal = items.reduce((s, it) => s + it.total, 0);

  const invalidateList = () => queryClient.invalidateQueries(trpc.invoices.list.queryFilter());
  const invalidateById = () =>
    queryClient.invalidateQueries(trpc.invoices.byId.queryFilter({ id: invoiceId }));

  const updateMutation = useMutation(
    trpc.invoices.update.mutationOptions({
      onSuccess: () => {
        invalidateList();
        invalidateById();
        toast.success("Rechnung gespeichert");
      },
      onError: () => toast.error("Fehler beim Speichern"),
    }),
  );

  const autoSaveMutation = useMutation(
    trpc.invoices.update.mutationOptions({
      onSuccess: () => {
        invalidateList();
        invalidateById();
      },
      onError: () => toast.error("Autosave fehlgeschlagen"),
    }),
  );

  const duplicate = useMutation(
    trpc.invoices.duplicate.mutationOptions({
      onSuccess: (data) => {
        invalidateList();
        toast.success("Rechnung dupliziert");
        navigate({ to: "/invoices/$id", params: { id: String(data.id) } });
      },
      onError: () => toast.error("Fehler beim Duplizieren"),
    }),
  );

  const updateStatus = useMutation(
    trpc.invoices.updateStatus.mutationOptions({
      onSuccess: () => {
        invalidateList();
        invalidateById();
        toast.success("Status aktualisiert");
      },
      onError: () => toast.error("Fehler beim Status ändern"),
    }),
  );

  const remove = useMutation(
    trpc.invoices.delete.mutationOptions({
      onSuccess: () => {
        invalidateList();
        toast.success("Rechnung gelöscht");
        navigate({ to: "/invoices" });
      },
      onError: () => toast.error("Fehler beim Löschen"),
    }),
  );

  const generateShareToken = useMutation(
    trpc.invoices.generateShareToken.mutationOptions({
      onSuccess: () => {
        invalidateById();
        toast.success("Share-Link erstellt");
      },
      onError: () => toast.error("Fehler beim Erstellen des Links"),
    }),
  );

  const revokeShareToken = useMutation(
    trpc.invoices.revokeShareToken.mutationOptions({
      onSuccess: () => {
        invalidateById();
        toast.success("Share-Link deaktiviert");
      },
      onError: () => toast.error("Fehler beim Deaktivieren des Links"),
    }),
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  function triggerAutoSave() {
    if (isLocked) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const v = form.state.values;
      if (!v.customerId) return;
      const currentItems = itemsRef.current;
      if (currentItems.some((it) => !it.description)) return;
      autoSaveMutation.mutate({
        id: invoiceId,
        data: {
          customerId: parseInt(v.customerId),
          date: v.date,
          dueDate: v.dueDate,
          notes: v.notes || undefined,
          total: currentItems.reduce((s, it) => s + it.total, 0),
          vatRate: v.vatRate ? parseFloat(v.vatRate) : null,
          items: currentItems,
        },
      });
    }, 1500);
  }

  const form = useForm({
    defaultValues: {
      customerId: invoice ? String(invoice.customerId) : "",
      date: invoice?.date ?? new Date().toISOString().slice(0, 10),
      dueDate: invoice?.dueDate ?? new Date().toISOString().slice(0, 10),
      notes: invoice?.notes ?? "",
      vatRate: invoice?.vatRate != null ? String(invoice.vatRate) : "",
    },
    onSubmit: async ({ value }) => {
      if (!value.customerId) {
        toast.error("Bitte einen Kunden wählen");
        return;
      }
      if (items.some((it) => !it.description)) {
        toast.error("Jede Position braucht eine Beschreibung");
        return;
      }
      await updateMutation.mutateAsync({
        id: invoiceId,
        data: {
          customerId: parseInt(value.customerId),
          date: value.date,
          dueDate: value.dueDate,
          notes: value.notes || undefined,
          total: grandTotal,
          vatRate: value.vatRate ? parseFloat(value.vatRate) : null,
          items,
        },
      });
    },
  });

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const merged = { ...it, ...patch };
        merged.total = parseFloat((merged.quantity * merged.unitPrice).toFixed(2));
        return merged;
      }),
    );
    triggerAutoSave();
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", notes: "", quantity: 1, unitPrice: 0, total: 0, sortOrder: prev.length },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    triggerAutoSave();
  }

  if (!invoice) {
    return (
      <PageContent>
        <p className="text-muted-foreground text-sm">Rechnung nicht gefunden.</p>
      </PageContent>
    );
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <PageTitle className="font-mono">{invoice.number}</PageTitle>
          </div>
          <Badge variant={invoice.status as "created" | "sent" | "paid"}>
            {invoice.status === "paid"
              ? "Bezahlt"
              : invoice.status === "sent"
                ? "Versendet"
                : "Offen"}
          </Badge>
          {isLocked && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
              <LockIcon className="size-3" />
              Gesperrt
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                if (!isLocked) {
                  const v = form.state.values;
                  if (v.customerId && !items.some((it) => !it.description)) {
                    await updateMutation.mutateAsync({
                      id: invoiceId,
                      data: {
                        customerId: parseInt(v.customerId),
                        date: v.date,
                        dueDate: v.dueDate,
                        notes: v.notes || undefined,
                        total: grandTotal,
                        vatRate: v.vatRate ? parseFloat(v.vatRate) : null,
                        items,
                      },
                    });
                  }
                }
                const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
                if (!res.ok) {
                  const msg = await res.text();
                  toast.error(msg || "PDF-Generierung fehlgeschlagen");
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${invoice.number}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                toast.error("PDF-Generierung fehlgeschlagen");
              }
            }}
          >
            <DownloadIcon className="size-3.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => duplicate.mutate({ id: invoiceId })}>
            <CopyIcon className="size-3.5" />
            Duplizieren
          </Button>
          {invoice.status === "created" && (
            <Button variant="outline" size="sm" onClick={() => setSendConfirmOpen(true)}>
              <SendIcon className="size-3.5" />
              Versenden
            </Button>
          )}
          {invoice.status === "sent" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus.mutate({ id: invoiceId, status: "paid" })}
              >
                <CheckIcon className="size-3.5" />
                Als bezahlt markieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus.mutate({ id: invoiceId, status: "created" })}
              >
                <RotateCcwIcon className="size-3.5" />
                Zurücksetzen
              </Button>
            </>
          )}
          {invoice.status === "paid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus.mutate({ id: invoiceId, status: "sent" })}
            >
              <RotateCcwIcon className="size-3.5" />
              Zurücksetzen
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2Icon className="size-3.5" />
            Löschen
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        {invoice.qrReference && (
          <span className="text-[10px] text-muted-foreground font-mono tracking-wide">
            Ref. {invoice.qrReference}
          </span>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <fieldset disabled={isLocked} className="contents">
            <InvoiceFormFields
              form={form}
              items={items}
              grandTotal={grandTotal}
              customers={customers}
              products={products}
              updateItem={updateItem}
              addItem={addItem}
              onRemoveItem={(i) => setRemoveTarget(i)}
              onFieldChange={triggerAutoSave}
            />
          </fieldset>

          {/* Share-Link */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-medium">Share-Link</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Teile die Rechnung mit deinem Kunden via Link (kein Login nötig).
                  </p>
                </div>
                {invoice.shareToken ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      readOnly
                      value={`${window.location.origin}/i/${invoice.shareToken}`}
                      className="text-xs border border-border rounded-md px-2 py-1.5 bg-muted font-mono w-72 cursor-text"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          `${window.location.origin}/i/${invoice.shareToken}`,
                        );
                        toast.success("Link kopiert");
                      }}
                    >
                      <CopyIcon className="size-3.5" />
                      Kopieren
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => revokeShareToken.mutate({ id: invoiceId })}
                      disabled={revokeShareToken.isPending}
                    >
                      <XIcon className="size-3.5" />
                      Deaktivieren
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateShareToken.mutate({ id: invoiceId })}
                    disabled={generateShareToken.isPending}
                  >
                    <LinkIcon className="size-3.5" />
                    Share-Link generieren
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end items-center">
            {!isLocked && autoSaveMutation.isPending && (
              <span className="text-xs text-muted-foreground">Speichert…</span>
            )}
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/invoices" })}>
              Zurück
            </Button>
            {!isLocked && (
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Wird gespeichert…" : "Speichern"}
              </Button>
            )}
          </div>
        </form>
      </PageContent>

      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        title="Rechnung versenden?"
        description="Nach dem Versenden kann die Rechnung nicht mehr bearbeitet werden."
        confirmLabel="Versenden"
        confirmVariant="default"
        isPending={updateStatus.isPending}
        onConfirm={() => {
          updateStatus.mutate(
            { id: invoiceId, status: "sent" },
            { onSettled: () => setSendConfirmOpen(false) },
          );
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Rechnung löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        isPending={remove.isPending}
        onConfirm={() => remove.mutate({ id: invoiceId })}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="Position entfernen?"
        confirmLabel="Entfernen"
        onConfirm={() => {
          if (removeTarget !== null) {
            removeItem(removeTarget);
            setRemoveTarget(null);
          }
        }}
      />
    </>
  );
}
