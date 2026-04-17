import { ProductForm } from "@/components/forms/product-form";
import {
  InvoiceSettingsFields,
  SenderFields,
  settingsFormDefaults,
} from "@/components/forms/settings-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Fragment } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Absender", description: "Deine Kontaktdaten für die Rechnung" },
  { id: 2, label: "Rechnungseinstellungen", description: "QR-IBAN und Standardwerte" },
  { id: 3, label: "Produkte", description: "Erstelle mindestens ein Produkt oder eine Dienstleistung" },
] as const;

export function OnboardingModal({ open }: { open: boolean }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions());
  const { data: products } = useSuspenseQuery(trpc.products.list.queryOptions());

  const upsertSettings = useMutation(
    trpc.settings.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.get.queryFilter());
      },
      onError: () => toast.error("Fehler beim Speichern der Einstellungen"),
    }),
  );

  const createProduct = useMutation(
    trpc.products.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.products.list.queryFilter());
        toast.success("Produkt erstellt");
      },
      onError: () => toast.error("Fehler beim Erstellen"),
    }),
  );

  const form = useForm({
    defaultValues: {
      ...settingsFormDefaults,
      senderName: settings?.senderName ?? "",
      senderCompany: settings?.senderCompany ?? "",
      senderAddress: settings?.senderAddress ?? "",
      senderZip: settings?.senderZip ?? "",
      senderCity: settings?.senderCity ?? "",
      senderCountry: settings?.senderCountry ?? "CH",
      senderEmail: settings?.senderEmail ?? "",
      senderPhone: settings?.senderPhone ?? "",
      qrIban: settings?.qrIban ?? "",
      defaultPaymentTermDays: settings?.defaultPaymentTermDays ?? 30,
      invoicePrefix: settings?.invoicePrefix ?? "INV",
      vatRate: settings?.vatRate != null ? String(settings.vatRate) : "",
    },
    onSubmit: async ({ value }) => {
      await upsertSettings.mutateAsync({
        senderName: value.senderName,
        senderCompany: value.senderCompany || undefined,
        senderAddress: value.senderAddress,
        senderZip: value.senderZip,
        senderCity: value.senderCity,
        senderCountry: value.senderCountry,
        senderEmail: value.senderEmail || undefined,
        senderPhone: value.senderPhone || undefined,
        qrIban: value.qrIban,
        defaultPaymentTermDays: Number(value.defaultPaymentTermDays),
        invoicePrefix: value.invoicePrefix,
        vatRate: value.vatRate ? parseFloat(value.vatRate) : null,
      });
      setStep(3);
    },
  });

  function validateStep1(): boolean {
    const v = form.state.values;
    if (!v.senderName.trim() || !v.senderAddress.trim() || !v.senderZip.trim() || !v.senderCity.trim()) {
      toast.error("Bitte alle Pflichtfelder (*) ausfüllen");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const v = form.state.values;
    if (!v.qrIban.trim()) {
      toast.error("Bitte QR-IBAN ausfüllen");
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      void form.handleSubmit();
    }
  }

  function handleFinish() {
    if (products.length === 0) {
      toast.error("Mindestens ein Produkt erforderlich");
      return;
    }
    toast.success("Einrichtung abgeschlossen");
    queryClient.invalidateQueries(trpc.settings.get.queryFilter());
    queryClient.invalidateQueries(trpc.products.list.queryFilter());
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}}>  {/* non-dismissible: ignore close events */}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity data-open:opacity-100 data-closed:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2",
            "bg-card border border-border shadow-lg overflow-y-auto",
            "flex flex-col gap-4 p-6",
            "data-open:animate-in data-closed:animate-out",
            "data-open:fade-in-0 data-closed:fade-out-0",
            "data-open:zoom-in-95 data-closed:zoom-out-95",
          )}
        >
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="font-serif text-base font-medium text-foreground">
              Willkommen bei oni-invoice
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-xs text-muted-foreground">
              Wir richten in drei kurzen Schritten alles ein, damit du deine erste Rechnung erstellen kannst.
            </DialogPrimitive.Description>
          </div>

          <StepIndicator step={step} />

          <div className="flex flex-col gap-1 mt-2">
            <h2 className="text-sm font-medium">{STEPS[step - 1].label}</h2>
            <p className="text-xs text-muted-foreground">{STEPS[step - 1].description}</p>
          </div>

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="flex flex-col gap-4"
            >
              <SenderFields form={form} />
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="submit">Weiter</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="flex flex-col gap-4"
            >
              <InvoiceSettingsFields form={form} />
              <div className="flex justify-between gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Zurück
                </Button>
                <Button type="submit" disabled={upsertSettings.isPending}>
                  {upsertSettings.isPending ? "Speichern..." : "Weiter"}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              {products.length > 0 && (
                <div className="border border-border">
                  <div className="px-3 py-2 border-b border-border bg-muted/30">
                    <p className="text-xs font-medium">Deine Produkte ({products.length})</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {products.map((p) => (
                      <li key={p.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground ml-2">
                            CHF {p.defaultPrice.toFixed(2)} / {p.unit}
                          </span>
                        </div>
                        <CheckIcon className="size-3.5 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Step3ProductForm
                onSubmit={(values) =>
                  createProduct.mutate({
                    name: values.name,
                    description: values.description || undefined,
                    defaultPrice: values.defaultPrice,
                    unit: values.unit,
                  })
                }
                isPending={createProduct.isPending}
                hasProducts={products.length > 0}
              />

              <div className="flex justify-between gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Zurück
                </Button>
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={products.length === 0}
                >
                  Fertig
                </Button>
              </div>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const isActive = s.id === step;
        const isDone = s.id < step;
        return (
          <Fragment key={s.id}>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center size-6 rounded-full text-[10px] font-bold shrink-0",
                  isDone && "bg-primary text-primary-foreground",
                  isActive && "bg-foreground text-background",
                  !isDone && !isActive && "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <CheckIcon className="size-3" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-3" />}
          </Fragment>
        );
      })}
    </div>
  );
}

function Step3ProductForm({
  onSubmit,
  isPending,
  hasProducts,
}: {
  onSubmit: (values: {
    name: string;
    description: string;
    defaultPrice: number;
    unit: "Stk" | "Std" | "Pauschal";
  }) => void;
  isPending: boolean;
  hasProducts: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <PlusIcon className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium">
          {hasProducts ? "Weiteres Produkt hinzufügen" : "Erstes Produkt erstellen"}
        </p>
      </div>
      <ProductForm
        key={formKey}
        showCancel={false}
        submitLabel="Hinzufügen"
        isPending={isPending}
        onSubmit={(values) => {
          onSubmit(values);
          setFormKey((k) => k + 1);
        }}
      />
    </div>
  );
}
