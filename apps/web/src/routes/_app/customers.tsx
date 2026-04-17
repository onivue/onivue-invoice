import { CustomerForm } from "@/components/forms/customer-form";
import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTRPC } from "@/utils/trpc";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers")({
  loader: ({ context: { trpc, queryClient } }) =>
    queryClient.ensureQueryData(trpc.customers.list.queryOptions()),
  pendingComponent: Loader,
  component: CustomersPage,
});

function CustomersPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: customers } = useSuspenseQuery(trpc.customers.list.queryOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(typeof customers)[number] | null>(null);

  const invalidate = () => queryClient.invalidateQueries(trpc.customers.list.queryFilter());

  const create = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        setCreateOpen(false);
        toast.success("Kunde erstellt");
      },
      onError: () => toast.error("Fehler beim Erstellen"),
    }),
  );

  const update = useMutation(
    trpc.customers.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setEditTarget(null);
        toast.success("Kunde gespeichert");
      },
      onError: () => toast.error("Fehler beim Speichern"),
    }),
  );

  const remove = useMutation(
    trpc.customers.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Kunde gelöscht");
      },
      onError: () => toast.error("Fehler beim Löschen"),
    }),
  );

  return (
    <>
      <PageHeader>
        <PageTitle>Kunden</PageTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" />
          Neuer Kunde
        </Button>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-xs">
                Noch keine Kunden erfasst.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Firma
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Ort</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      E-Mail
                    </th>
                    <th className="w-20 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer"
                      onClick={() => setEditTarget(c)}
                    >
                      <td className="px-4 py-2.5 font-medium">{c.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.company ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {c.zip} {c.city}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setEditTarget(c)}
                            aria-label="bearbeiten"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => remove.mutate({ id: c.id })}
                            aria-label="löschen"
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={(values) =>
              create.mutate({
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
            isPending={create.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <CustomerForm
              initial={{
                name: editTarget.name,
                company: editTarget.company ?? "",
                address: editTarget.address,
                zip: editTarget.zip,
                city: editTarget.city,
                country: editTarget.country,
                email: editTarget.email ?? "",
                phone: editTarget.phone ?? "",
              }}
              onSubmit={(values) =>
                update.mutate({
                  id: editTarget.id,
                  data: {
                    name: values.name,
                    company: values.company || undefined,
                    address: values.address,
                    zip: values.zip,
                    city: values.city,
                    country: values.country,
                    email: values.email || undefined,
                    phone: values.phone || undefined,
                  },
                })
              }
              isPending={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
