import {
  InvoiceSettingsFields,
  SenderFields,
  settingsFormDefaults,
} from "@/components/forms/settings-form";
import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceCard } from "@/components/workspace-card";
import { useTRPC } from "@/utils/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  loader: ({ context: { trpc, queryClient } }) =>
    queryClient.ensureQueryData(trpc.settings.get.queryOptions()),
  pendingComponent: Loader,
  component: SettingsPage,
});

function SettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: current } = useSuspenseQuery(trpc.settings.get.queryOptions());

  const upsert = useMutation(
    trpc.settings.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.get.queryFilter());
        toast.success("Einstellungen gespeichert");
      },
      onError: () => toast.error("Fehler beim Speichern"),
    }),
  );

  const form = useForm({
    defaultValues: {
      ...settingsFormDefaults,
      senderName: current?.senderName ?? "",
      senderCompany: current?.senderCompany ?? "",
      senderAddress: current?.senderAddress ?? "",
      senderZip: current?.senderZip ?? "",
      senderCity: current?.senderCity ?? "",
      senderCountry: current?.senderCountry ?? "CH",
      senderEmail: current?.senderEmail ?? "",
      senderPhone: current?.senderPhone ?? "",
      qrIban: current?.qrIban ?? "",
      defaultPaymentTermDays: current?.defaultPaymentTermDays ?? 30,
      invoicePrefix: current?.invoicePrefix ?? "INV",
      vatRate: current?.vatRate != null ? String(current.vatRate) : "",
    },
    onSubmit: async ({ value }) => {
      await upsert.mutateAsync({
        senderName: value.senderName,
        senderCompany: value.senderCompany || undefined,
        senderAddress: value.senderAddress,
        senderZip: value.senderZip,
        senderCity: value.senderCity,
        senderCountry: value.senderCountry,
        senderEmail: value.senderEmail || undefined,
        senderPhone: value.senderPhone || undefined,
        qrIban: value.qrIban.replace(/\s+/g, ""),
        defaultPaymentTermDays: Number(value.defaultPaymentTermDays),
        invoicePrefix: value.invoicePrefix,
        vatRate: value.vatRate ? parseFloat(value.vatRate) : null,
      });
    },
  });

  return (
    <>
      <PageHeader>
        <PageTitle>Einstellungen</PageTitle>
      </PageHeader>
      <PageContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <Card>
            <CardHeader className="pt-4">
              <CardTitle>Absender</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-4">
              <SenderFields form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pt-4">
              <CardTitle>Rechnungseinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-4">
              <InvoiceSettingsFields form={form} />
            </CardContent>
          </Card>

          <Button type="submit" disabled={upsert.isPending} className={"w-fit self-end"}>
            {upsert.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </form>
        <WorkspaceCard />
      </PageContent>
    </>
  );
}
