import { CustomerForm } from "@/components/forms/customer-form";
import { InvoiceFormFields } from "@/components/forms/invoice-form-fields";
import type { LineItem } from "@/components/forms/invoice-form-fields";
import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTRPC } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/new")({
  loader: async ({ context: { trpc, queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(trpc.customers.list.queryOptions()),
      queryClient.ensureQueryData(trpc.products.list.queryOptions()),
      queryClient.ensureQueryData(trpc.settings.get.queryOptions()),
    ]);
  },
  pendingComponent: Loader,
  component: NewInvoicePage,
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function NewInvoicePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: customers } = useSuspenseQuery(trpc.customers.list.queryOptions());
  const { data: products } = useSuspenseQuery(trpc.products.list.queryOptions());
  const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions());

  const defaultDueDays = settings?.defaultPaymentTermDays ?? 30;

  const [items, setItems] = useState<LineItem[]>([
    { description: "", notes: "", quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 },
  ]);
  const [customerModalOpen, setCustomerModalOpen] = useState(customers.length === 0);

  const grandTotal = items.reduce((s, it) => s + it.total, 0);

  const createMutation = useMutation(
    trpc.invoices.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(trpc.invoices.list.queryFilter());
        toast.success("Rechnung erstellt");
        navigate({ to: "/invoices/$id", params: { id: String(created.id) } });
      },
      onError: () => toast.error("Fehler beim Erstellen"),
    }),
  );

  const createCustomer = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: (newCustomer) => {
        queryClient.invalidateQueries(trpc.customers.list.queryFilter());
        form.setFieldValue("customerId", String(newCustomer.id));
        setCustomerModalOpen(false);
        toast.success("Kunde erstellt");
      },
      onError: () => toast.error("Fehler beim Erstellen"),
    }),
  );

  const form = useForm({
    defaultValues: {
      customerId: "",
      date: today(),
      dueDate: addDays(defaultDueDays),
      notes: "",
      vatRate: settings?.vatRate != null ? String(settings.vatRate) : "",
    },
    onSubmit: async ({ value }) => {
      if (items.some((it) => !it.description)) {
        toast.error("Jede Position braucht eine Beschreibung");
        return;
      }
      await createMutation.mutateAsync({
        customerId: parseInt(value.customerId),
        date: value.date,
        dueDate: value.dueDate,
        notes: value.notes || undefined,
        total: grandTotal,
        vatRate: value.vatRate ? parseFloat(value.vatRate) : null,
        items,
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
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", notes: "", quantity: 1, unitPrice: 0, total: 0, sortOrder: prev.length },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Neue Rechnung</PageTitle>
      </PageHeader>

      <PageContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <InvoiceFormFields
            form={form}
            items={items}
            grandTotal={grandTotal}
            customers={customers}
            products={products}
            updateItem={updateItem}
            addItem={addItem}
            onRemoveItem={removeItem}
            onCustomerAdd={() => setCustomerModalOpen(true)}
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/invoices" })}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Wird gespeichert…" : "Rechnung erstellen"}
            </Button>
          </div>
        </form>
      </PageContent>

      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={(values) =>
              createCustomer.mutate({
                name: values.name,
                company: values.company || undefined,
                address: values.address,
                zip: values.zip,
                city: values.city,
                country: values.country,
                email: values.email || undefined,
                phone: values.phone || undefined,
              })
            }
            isPending={createCustomer.isPending}
            onCancel={customers.length > 0 ? () => setCustomerModalOpen(false) : undefined}
            showCancel={customers.length > 0}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
