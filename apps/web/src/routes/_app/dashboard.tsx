import { PageContent, PageHeader, PageTitle } from "@/components/layout/page";
import Loader from "@/components/loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  loader: ({ context: { trpc, queryClient } }) =>
    queryClient.ensureQueryData(trpc.invoices.list.queryOptions()),
  pendingComponent: Loader,
  component: DashboardPage,
});

function formatDate(iso: string) {
  const p = iso.split("-");
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function DashboardPage() {
  const trpc = useTRPC();
  const { data: invoices } = useSuspenseQuery(trpc.invoices.list.queryOptions());
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear().toString();

  const openInvoices = invoices.filter((inv) => inv.status === "created");
  const openTotal = openInvoices.reduce((s, inv) => s + inv.total, 0);

  const paidThisYear = invoices.filter(
    (inv) => inv.status === "paid" && inv.date.startsWith(currentYear),
  );
  const paidTotal = paidThisYear.reduce((s, inv) => s + inv.total, 0);

  const totalRevenue = invoices
    .filter((inv) => inv.date.startsWith(currentYear))
    .reduce((s, inv) => s + inv.total, 0);

  const recent = invoices.slice(0, 5);

  return (
    <>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
      </PageHeader>

      <PageContent>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Offene Rechnungen</p>
              <p className="text-2xl font-bold font-mono">{openInvoices.length}</p>
              <p className="text-xs text-muted-foreground mt-1">CHF {openTotal.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Bezahlt {currentYear}</p>
              <p className="text-2xl font-bold font-mono">{paidThisYear.length}</p>
              <p className="text-xs text-muted-foreground mt-1">CHF {paidTotal.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Umsatz {currentYear}</p>
              <p className="text-2xl font-bold font-mono">CHF {totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.filter((inv) => inv.date.startsWith(currentYear)).length} Rechnungen
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Letzte Rechnungen</h2>
            </div>
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Noch keine Rechnungen.{" "}
                <Link to="/invoices/new" className="underline underline-offset-2">
                  Erste Rechnung erstellen
                </Link>
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nr.</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Kunde</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Datum</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer"
                      onClick={() =>
                        navigate({ to: "/invoices/$id", params: { id: String(inv.id) } })
                      }
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to="/invoices/$id"
                          params={{ id: String(inv.id) }}
                          className="font-mono hover:underline underline-offset-2"
                        >
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{inv.customerCompany ?? inv.customerName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(inv.date)}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
