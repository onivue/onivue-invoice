import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";

export const Route = createFileRoute("/i/$token")({
  loader: ({ context: { trpc, queryClient }, params }) =>
    queryClient.ensureQueryData(
      trpc.invoices.byShareToken.queryOptions({ token: params.token }),
    ),
  pendingComponent: Loader,
  component: PublicInvoicePage,
});

function formatDate(iso: string) {
  const p = iso.split("-");
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function PublicInvoicePage() {
  const trpc = useTRPC();
  const { token } = Route.useParams();
  const { data: invoice } = useSuspenseQuery(
    trpc.invoices.byShareToken.queryOptions({ token }),
  );

  if (!invoice) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Rechnung nicht gefunden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dieser Link ist ungültig oder wurde widerrufen.
          </p>
          <Link to="/" className="text-sm underline mt-4 inline-block">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    invoice.status === "paid" ? "Bezahlt" : invoice.status === "sent" ? "Versendet" : "Offen";

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-sm font-medium tracking-wide">oni-invoice</span>
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
        >
          <DownloadIcon className="size-3.5" />
          PDF herunterladen
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Invoice header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-mono">{invoice.number}</h1>
            {invoice.qrReference && (
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Ref. {invoice.qrReference}
              </p>
            )}
          </div>
          <Badge variant={invoice.status as "created" | "sent" | "paid"}>{statusLabel}</Badge>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Rechnungsdatum</p>
            <p className="font-medium">{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fällig am</p>
            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Customer */}
        {invoice.customer && (
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-1">Empfänger</p>
            <p className="font-medium text-sm">
              {invoice.customer.company
                ? `${invoice.customer.company} · ${invoice.customer.name}`
                : invoice.customer.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.address}, {invoice.customer.zip} {invoice.customer.city}
            </p>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-1">Notizen</p>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="border border-border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Beschreibung</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Menge</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Preis</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p>{item.description}</p>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">CHF {item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">CHF {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total CHF</td>
                <td className="px-4 py-3 text-right font-bold text-base">
                  {invoice.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}
