import { ProductForm } from "@/components/forms/product-form";
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

export const Route = createFileRoute("/_app/products")({
  loader: ({ context: { trpc, queryClient } }) =>
    queryClient.ensureQueryData(trpc.products.list.queryOptions()),
  pendingComponent: Loader,
  component: ProductsPage,
});

function ProductsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: products } = useSuspenseQuery(trpc.products.list.queryOptions());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(typeof products)[number] | null>(null);

  const invalidate = () => queryClient.invalidateQueries(trpc.products.list.queryFilter());

  const create = useMutation(
    trpc.products.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        setCreateOpen(false);
        toast.success("Produkt erstellt");
      },
      onError: () => toast.error("Fehler beim Erstellen"),
    }),
  );

  const update = useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        invalidate();
        setEditTarget(null);
        toast.success("Produkt gespeichert");
      },
      onError: () => toast.error("Fehler beim Speichern"),
    }),
  );

  const remove = useMutation(
    trpc.products.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Produkt gelöscht");
      },
      onError: () => toast.error("Fehler beim Löschen"),
    }),
  );

  return (
    <>
      <PageHeader>
        <PageTitle>Produkte & Dienstleistungen</PageTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" />
          Neues Produkt
        </Button>
      </PageHeader>

      <PageContent>
        <Card>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-xs">
                Noch keine Produkte erfasst.
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
                      Beschreibung
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Preis
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Einheit
                    </th>
                    <th className="w-20 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer"
                      onClick={() => setEditTarget(p)}
                    >
                      <td className="px-4 py-2.5 font-medium">{p.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.description ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">CHF {p.defaultPrice.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.unit}</td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setEditTarget(p)}
                            aria-label="bearbeiten"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => remove.mutate({ id: p.id })}
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
            <DialogTitle>Neues Produkt</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={(values) =>
              create.mutate({
                name: values.name,
                description: values.description || undefined,
                defaultPrice: values.defaultPrice,
                unit: values.unit,
              })
            }
            isPending={create.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produkt bearbeiten</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ProductForm
              initial={{
                name: editTarget.name,
                description: editTarget.description ?? "",
                defaultPrice: editTarget.defaultPrice,
                unit: editTarget.unit,
              }}
              onSubmit={(values) =>
                update.mutate({
                  id: editTarget.id,
                  data: {
                    name: values.name,
                    description: values.description || undefined,
                    defaultPrice: values.defaultPrice,
                    unit: values.unit,
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
