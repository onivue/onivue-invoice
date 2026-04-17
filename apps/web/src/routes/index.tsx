import { authClient } from "@/lib/auth-client";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FileText, Lock, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: "/invoices" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-lg font-medium tracking-wide">oni-invoice</span>
        <Link
          to="/login"
          className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          Anmelden
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Rechnungen schreiben,
          <br />
          <span className="text-muted-foreground">einfach und schnell.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Professionelle Rechnungen mit QR-Code für Schweizer Zahlungen. Für Freelancer und kleine
          Unternehmen.
        </p>
        <Link
          to="/login"
          className="bg-foreground text-background px-6 py-3 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Kostenlos starten
        </Link>
      </main>

      {/* Features */}
      <section className="px-6 py-16 border-t border-border">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Swiss QR-Bill</p>
              <p className="text-xs text-muted-foreground mt-1">
                Automatische QR-Rechnung nach Standard
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Users className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Team-Workspaces</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gemeinsam mit deinem Team arbeiten
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Lock className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Passkey-Auth</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sicher anmelden ohne Passwort
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Zap className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">PDF-Export</p>
              <p className="text-xs text-muted-foreground mt-1">
                Professionelle PDFs auf Knopfdruck
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Onivue Invoice
        </p>
      </footer>
    </div>
  );
}
