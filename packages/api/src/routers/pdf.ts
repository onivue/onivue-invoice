import { customers, db, invoiceItems, invoices, settings } from "@onivue-invoice/db";
import { eq } from "drizzle-orm";
import { fileURLToPath } from "node:url";

const FONT_REGULAR_PATH = fileURLToPath(
  new URL("../fonts/JetBrainsMono-Regular.ttf", import.meta.url),
);
const FONT_BOLD_PATH = fileURLToPath(
  new URL("../fonts/JetBrainsMono-Bold.ttf", import.meta.url),
);

// design constants — adjust here for all PDFs
const DESIGN = {
  marginLeft: 57,
  marginRight: 57,
  primaryColor: "#141413",
  accentColor: "#c96442",
  mutedColor: "#87867f",
  lineColor: "#e8e6dc",
  fontSize: {
    small: 8,
    body: 9,
    label: 7.5,
    heading: 12,
    total: 11,
  },
  font: "Mono",
  fontBold: "MonoBold",
} as const;

function formatCHF(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function formatDate(isoDate: string): string {
  const parts = isoDate.split("-");
  return `${parts[2] ?? ""}.${parts[1] ?? ""}.${parts[0] ?? ""}`;
}

// generate a valid 27-digit QR reference from an invoice id
// uses modulo-10 recursive check digit (ISO 7064 variant used by SIX)
export async function generateInvoicePdf(
  invoiceId: number,
): Promise<{ buffer: Buffer; number: string }> {
  const invoiceRows = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoiceRows[0]) throw new Error(`invoice ${invoiceId} not found`);
  const invoice = invoiceRows[0];

  const customerRows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, invoice.customerId));
  if (!customerRows[0]) throw new Error(`customer not found`);
  const customer = customerRows[0];

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(invoiceItems.sortOrder);

  const settingsRows = await db
    .select()
    .from(settings)
    .where(eq(settings.workspaceId, invoice.workspaceId));
  if (!settingsRows[0])
    throw new Error("Bitte zuerst die Einstellungen ausfüllen (Absender & QR-IBAN).");
  const s = settingsRows[0];
  if (!s.qrIban) throw new Error("QR-IBAN fehlt in den Einstellungen.");

  const qrIbanNormalized = s.qrIban.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (qrIbanNormalized.length !== 21) {
    throw new Error(
      `QR-IBAN hat eine ungültige Länge (${qrIbanNormalized.length} statt 21 Zeichen). Bitte in den Einstellungen korrigieren.`,
    );
  }

  const [{ default: PDFDocument }, { SwissQRBill }] = await Promise.all([
    import("pdfkit"),
    import("swissqrbill/pdf"),
  ]);

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const doc = new PDFDocument({
      size: "A4",
      autoFirstPage: false,
      margins: {
        top: DESIGN.marginLeft,
        bottom: 0,
        left: DESIGN.marginLeft,
        right: DESIGN.marginRight,
      },
    });

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont(DESIGN.font, FONT_REGULAR_PATH);
    doc.registerFont(DESIGN.fontBold, FONT_BOLD_PATH);

    // page 1: invoice
    doc.addPage();
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - DESIGN.marginLeft - DESIGN.marginRight;

    // sender block (top left)
    doc
      .font(DESIGN.fontBold)
      .fontSize(DESIGN.fontSize.body)
      .fillColor(DESIGN.primaryColor)
      .text(s.senderName, DESIGN.marginLeft, 57);
    if (s.senderCompany) {
      doc.font(DESIGN.font).text(s.senderCompany);
    }
    doc
      .font(DESIGN.font)
      .fontSize(DESIGN.fontSize.body)
      .text(s.senderAddress)
      .text(`${s.senderZip} ${s.senderCity}`);

    // meta block (top right)
    const metaX = pageWidth - DESIGN.marginRight - 160;
    doc
      .font(DESIGN.font)
      .fontSize(DESIGN.fontSize.body)
      .fillColor(DESIGN.mutedColor)
      .text("Rechnungsnummer", metaX, 57, { width: 160, align: "left" });
    doc
      .font(DESIGN.fontBold)
      .fillColor(DESIGN.primaryColor)
      .text(invoice.number, metaX, doc.y, { width: 160, align: "left" });

    doc
      .font(DESIGN.font)
      .fillColor(DESIGN.mutedColor)
      .text("Rechnungsdatum", metaX, doc.y + 6, { width: 160 });
    doc
      .font(DESIGN.fontBold)
      .fillColor(DESIGN.primaryColor)
      .text(formatDate(invoice.date), metaX, doc.y, { width: 160 });

    doc
      .font(DESIGN.font)
      .fillColor(DESIGN.mutedColor)
      .text("Fällig am", metaX, doc.y + 6, { width: 160 });
    doc
      .font(DESIGN.fontBold)
      .fillColor(DESIGN.primaryColor)
      .text(formatDate(invoice.dueDate), metaX, doc.y, { width: 160 });
    const metaEndY = doc.y;

    // customer address block (right side, below meta block)
    const customerX = metaX;
    const customerWidth = 160;
    const customerY = metaEndY + 16;
    doc.font(DESIGN.font).fontSize(DESIGN.fontSize.body).fillColor(DESIGN.primaryColor);
    if (customer.company) {
      doc
        .font(DESIGN.fontBold)
        .text(customer.company, customerX, customerY, { width: customerWidth });
      doc.font(DESIGN.font).text(customer.name, customerX, doc.y, { width: customerWidth });
    } else {
      doc.font(DESIGN.fontBold).text(customer.name, customerX, customerY, { width: customerWidth });
    }
    doc
      .font(DESIGN.font)
      .text(customer.address, customerX, doc.y, { width: customerWidth })
      .text(`${customer.zip} ${customer.city}`, customerX, doc.y, { width: customerWidth });

    // items table header
    const tableY = doc.y + 18;
    const colWidths: [number, number, number, number] = [
      contentWidth * 0.45,
      contentWidth * 0.25,
      contentWidth * 0.15,
      contentWidth * 0.15,
    ];
    const cols: [number, number, number, number] = [
      DESIGN.marginLeft,
      DESIGN.marginLeft + colWidths[0],
      DESIGN.marginLeft + colWidths[0] + colWidths[1],
      DESIGN.marginLeft + colWidths[0] + colWidths[1] + colWidths[2],
    ];

    doc
      .moveTo(DESIGN.marginLeft, tableY)
      .lineTo(pageWidth - DESIGN.marginRight, tableY)
      .strokeColor(DESIGN.lineColor)
      .lineWidth(0.5)
      .stroke();

    const headerY = tableY + 5;
    doc
      .font(DESIGN.fontBold)
      .fontSize(DESIGN.fontSize.label)
      .fillColor(DESIGN.mutedColor)
      .text("Produkt", cols[0], headerY, { width: colWidths[0] })
      .text("Einzelpreis", cols[1], headerY, { width: colWidths[1] })
      .text("Menge", cols[2], headerY, { width: colWidths[2] })
      .text("Summe", cols[3], headerY, { width: colWidths[3], align: "right" });

    let rowY = doc.y + 4;
    doc
      .moveTo(DESIGN.marginLeft, rowY)
      .lineTo(pageWidth - DESIGN.marginRight, rowY)
      .strokeColor(DESIGN.lineColor)
      .lineWidth(0.5)
      .stroke();

    // items
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]!;
      const posNr = 1001 + idx;
      rowY += 5;

      const descH = doc.heightOfString(item.description, { width: colWidths[0] - 4 });
      const notesH = item.notes
        ? doc.heightOfString(item.notes, { width: colWidths[0] - 4 }) + 2
        : 0;
      const rowContentH = Math.max(10 + 1 + descH + notesH, 14);

      // pos nr
      doc
        .font(DESIGN.fontBold)
        .fontSize(DESIGN.fontSize.label)
        .fillColor(DESIGN.mutedColor)
        .text(`${posNr}`, cols[0], rowY, { width: colWidths[0] - 4, lineBreak: false });

      // description
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.primaryColor)
        .text(item.description, cols[0], rowY + 11, { width: colWidths[0] - 4 });

      // optional notes below description
      if (item.notes) {
        doc
          .font(DESIGN.font)
          .fontSize(DESIGN.fontSize.small)
          .fillColor(DESIGN.mutedColor)
          .text(item.notes, cols[0], rowY + 11 + descH + 1, { width: colWidths[0] - 4 });
      }

      // price / qty / total aligned to description row
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.primaryColor)
        .text(formatCHF(item.unitPrice), cols[1], rowY + 11, { width: colWidths[1] })
        .text(String(item.quantity), cols[2], rowY + 11, { width: colWidths[2] })
        .text(formatCHF(item.total), cols[3], rowY + 11, {
          width: colWidths[3],
          align: "right",
        });

      rowY += rowContentH + 4;

      doc
        .moveTo(DESIGN.marginLeft, rowY)
        .lineTo(pageWidth - DESIGN.marginRight, rowY)
        .strokeColor(DESIGN.lineColor)
        .lineWidth(0.3)
        .stroke();
    }

    // total block
    const vatRate = invoice.vatRate ?? null;
    const netTotal = invoice.total;
    const vatAmount = vatRate != null ? parseFloat(((netTotal * vatRate) / 100).toFixed(2)) : 0;
    const grossTotal = vatRate != null ? parseFloat((netTotal + vatAmount).toFixed(2)) : netTotal;

    let currentTotalY = rowY + 10;

    const labelX = cols[1];
    const labelW = colWidths[1] + colWidths[2];

    if (vatRate != null) {
      // subtotal (net)
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.mutedColor)
        .text("Subtotal (exkl. MWST)", labelX, currentTotalY, { width: labelW });
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.primaryColor)
        .text(formatCHF(netTotal), cols[3], currentTotalY, { width: colWidths[3], align: "right" });

      currentTotalY = doc.y + 4;

      // VAT line
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.mutedColor)
        .text(`MWST ${vatRate}%`, labelX, currentTotalY, { width: labelW });
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.primaryColor)
        .text(formatCHF(vatAmount), cols[3], currentTotalY, {
          width: colWidths[3],
          align: "right",
        });

      currentTotalY = doc.y + 4;

      // total (gross)
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.mutedColor)
        .text("Offener Betrag (inkl. MWST)", labelX, currentTotalY, { width: labelW });
      doc
        .font(DESIGN.fontBold)
        .fontSize(DESIGN.fontSize.total)
        .fillColor(DESIGN.primaryColor)
        .text(formatCHF(grossTotal), cols[3], currentTotalY, {
          width: colWidths[3],
          align: "right",
        });
    } else {
      // no VAT
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.label)
        .fillColor(DESIGN.mutedColor)
        .text("Nicht MWST-pflichtig", labelX, currentTotalY, { width: labelW });

      currentTotalY = doc.y + 4;

      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.mutedColor)
        .text("Offener Betrag", labelX, currentTotalY, { width: labelW });
      doc
        .font(DESIGN.fontBold)
        .fontSize(DESIGN.fontSize.total)
        .fillColor(DESIGN.primaryColor)
        .text(formatCHF(netTotal), cols[3], currentTotalY, { width: colWidths[3], align: "right" });
    }

    // notes / conditions
    if (invoice.notes) {
      const notesY = doc.y + 20;
      doc
        .font(DESIGN.font)
        .fontSize(DESIGN.fontSize.body)
        .fillColor(DESIGN.mutedColor)
        .text(invoice.notes, DESIGN.marginLeft, notesY, {
          width: contentWidth,
        });
    }

    // page 2: QR bill
    doc.addPage();

    const qrBill = new SwissQRBill(
      {
        currency: "CHF",
        amount: grossTotal,
        creditor: {
          name: s.senderName,
          address: s.senderAddress,
          zip: s.senderZip,
          city: s.senderCity,
          country: s.senderCountry as "CH",
          account: qrIbanNormalized,
        },
        debtor: {
          name: customer.company ? `${customer.company}, ${customer.name}` : customer.name,
          address: customer.address,
          zip: customer.zip,
          city: customer.city,
          country: customer.country as "CH",
        },
        reference: invoice.qrReference!,
        message: invoice.notes ?? undefined,
      },
      { language: "DE" },
    );

    qrBill.attachTo(doc);
    doc.end();
  });

  return { buffer, number: invoice.number };
}
