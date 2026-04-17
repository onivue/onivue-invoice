import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

export type SettingsFormValues = {
  senderName: string;
  senderCompany: string;
  senderAddress: string;
  senderZip: string;
  senderCity: string;
  senderCountry: string;
  senderEmail: string;
  senderPhone: string;
  qrIban: string;
  defaultPaymentTermDays: number;
  invoicePrefix: string;
  vatRate: string; // "" = exempt, "8.1" = 8.1%, etc.
};

export const settingsFormDefaults: SettingsFormValues = {
  senderName: "",
  senderCompany: "",
  senderAddress: "",
  senderZip: "",
  senderCity: "",
  senderCountry: "CH",
  senderEmail: "",
  senderPhone: "",
  qrIban: "",
  defaultPaymentTermDays: 30,
  invoicePrefix: "R",
  vatRate: "",
};

type AnyField = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Form = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function FieldError({ field }: { field: AnyField }) {
  const errors: string[] = field.state.meta.errors ?? [];
  if (!errors.length) return null;
  return <p className="mt-0.5 text-xs text-destructive">{errors[0]}</p>;
}

function required(label: string) {
  return ({ value }: { value: string }) =>
    !value?.trim() ? `${label} ist erforderlich` : undefined;
}

function validateQrIban({ value }: { value: string }) {
  const clean = (value ?? "").replace(/\s+/g, "").toUpperCase();
  if (!clean) return "QR-IBAN ist erforderlich";
  if (clean.length !== 21)
    return `QR-IBAN muss 21 Zeichen haben (ohne Leerzeichen), aktuell: ${clean.length}`;
  if (!clean.startsWith("CH")) return "QR-IBAN muss mit CH beginnen";
  return undefined;
}

export function SenderFields({ form }: { form: Form }) {
  return (
    <div className="flex flex-col gap-3">
      <form.Field
        name="senderName"
        validators={{ onBlur: required("Name"), onSubmit: required("Name") }}
      >
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Name *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Max Muster"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="senderCompany">
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Firma</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="optional"
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="senderAddress"
        validators={{ onBlur: required("Adresse"), onSubmit: required("Adresse") }}
      >
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Adresse *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Musterstrasse 1"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-3 gap-3">
        <form.Field
          name="senderZip"
          validators={{ onBlur: required("PLZ"), onSubmit: required("PLZ") }}
        >
          {(field: AnyField) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>PLZ *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="9000"
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field
          name="senderCity"
          validators={{ onBlur: required("Ort"), onSubmit: required("Ort") }}
        >
          {(field: AnyField) => (
            <div className="col-span-2 flex flex-col gap-1">
              <Label htmlFor={field.name}>Ort *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="St. Gallen"
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="senderEmail">
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>E-Mail</Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="max@beispiel.ch"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="senderPhone">
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Telefon</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="+41 79 000 00 00"
            />
          </div>
        )}
      </form.Field>
    </div>
  );
}

export function InvoiceSettingsFields({ form }: { form: Form }) {
  return (
    <div className="flex flex-col gap-3">
      <form.Field name="qrIban" validators={{ onBlur: validateQrIban, onSubmit: validateQrIban }}>
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>QR-IBAN *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="CH68 0840 1000 0775 1247 2"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="invoicePrefix">
          {(field: AnyField) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>Nummernpräfix</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="R"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="defaultPaymentTermDays">
          {(field: AnyField) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>Zahlungsfrist (Tage)</Label>
              <NumericInput
                id={field.name}
                fallback={30}
                value={field.state.value}
                onBlur={field.handleBlur}
                onValueChange={(n) => field.handleChange(n || 30)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="vatRate">
        {(field: AnyField) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>MWST</Label>
            <Select
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <SelectOption value="">Nicht MWST-pflichtig</SelectOption>
              <SelectOption value="2.6">2.6% (Sonderrate)</SelectOption>
              <SelectOption value="3.8">3.8% (Beherbergung)</SelectOption>
              <SelectOption value="8.1">8.1% (Normalsatz)</SelectOption>
            </Select>
          </div>
        )}
      </form.Field>
    </div>
  );
}
