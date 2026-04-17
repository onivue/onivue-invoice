import { generateInvoicePdf } from "@onivue-invoice/api/routers/pdf";
import { createFileRoute } from "@tanstack/react-router";

async function handler({ params }: { request: Request; params: Record<string, string> }) {
  const id = parseInt(params.id ?? "");
  if (isNaN(id)) {
    return new Response("invalid id", { status: 400 });
  }

  try {
    const { buffer, number } = await generateInvoicePdf(id);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${number}.pdf"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "pdf generation failed";
    console.error("[pdf] generation failed for invoice", id, err);
    return new Response(message, { status: 500 });
  }
}

export const Route = createFileRoute("/api/invoices/$id/pdf")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
