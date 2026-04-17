import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Trash2Icon } from "lucide-react";

export type LineItem = {
  productId?: number;
  description: string;
  notes: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

type Props = {
  form: AnyForm;
  items: LineItem[];
  grandTotal: number;
  customers: Array<{ id: number; name: string; company?: string | null }>;
  products: Array<{ id: number; name: string; description?: string | null; defaultPrice: number }>;
  updateItem: (index: number, patch: Partial<LineItem>) => void;
  addItem: () => void;
  onRemoveItem: (index: number) => void;
  onFieldChange?: () => void;
  onCustomerAdd?: () => void;
};

export function InvoiceFormFields({
  form,
  items,
  grandTotal,
  customers,
  products,
  updateItem,
  addItem,
  onRemoveItem,
  onFieldChange,
  onCustomerAdd,
}: Props) {
  function applyProduct(index: number, productId: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(index, {
      productId: product.id,
      description: product.name,
      notes: product.description ?? "",
      unitPrice: product.defaultPrice,
    });
  }

  return (
    <>
      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerId">Kunde *</Label>
            <div className="flex gap-2">
              <form.Field
                name="customerId"
                validators={{
                  onSubmit: ({ value }: { value: string }) =>
                    !value ? "Bitte einen Kunden wählen" : undefined,
                }}
              >
                {(field: AnyForm) => (
                  <div className="flex flex-col gap-0.5 flex-1">
                    <Select
                      id="customerId"
                      value={field.state.value}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        field.handleChange(e.target.value);
                        onFieldChange?.();
                      }}
                      aria-invalid={field.state.meta.errors.length > 0}
                    >
                      <SelectOption value="">— Bitte wählen —</SelectOption>
                      {customers.map((c) => (
                        <SelectOption key={c.id} value={String(c.id)}>
                          {c.company ? `${c.company} / ${c.name}` : c.name}
                        </SelectOption>
                      ))}
                    </Select>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors[0] as string}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              {onCustomerAdd && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onCustomerAdd}
                  aria-label="Neuen Kunden erstellen"
                  title="Neuen Kunden erstellen"
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Datum *</Label>
            <form.Field name="date">
              {(field: AnyForm) => (
                <Input
                  id="date"
                  type="date"
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    field.handleChange(e.target.value);
                    onFieldChange?.();
                  }}
                />
              )}
            </form.Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Fällig am *</Label>
            <form.Field name="dueDate">
              {(field: AnyForm) => (
                <Input
                  id="dueDate"
                  type="date"
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    field.handleChange(e.target.value);
                    onFieldChange?.();
                  }}
                />
              )}
            </form.Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vatRate">MWST</Label>
            <form.Field name="vatRate">
              {(field: AnyForm) => (
                <Select
                  id="vatRate"
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    field.handleChange(e.target.value);
                    onFieldChange?.();
                  }}
                >
                  <SelectOption value="">Nicht MWST-pflichtig</SelectOption>
                  <SelectOption value="2.6">2.6% (Sonderrate)</SelectOption>
                  <SelectOption value="3.8">3.8% (Beherbergung)</SelectOption>
                  <SelectOption value="8.1">8.1% (Normalsatz)</SelectOption>
                </Select>
              )}
            </form.Field>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <form.Field name="notes">
              {(field: AnyForm) => (
                <Textarea
                  id="notes"
                  rows={3}
                  value={field.state.value}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    field.handleChange(e.target.value);
                    onFieldChange?.();
                  }}
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Produkt
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                    Beschreibung / Zusatz
                  </th>
                  <th className="w-20 px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Menge
                  </th>
                  <th className="w-28 px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Preis CHF
                  </th>
                  <th className="w-28 px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Total CHF
                  </th>
                  <th className="w-8 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Select
                        value={item.productId ? String(item.productId) : ""}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const pid = parseInt(e.target.value);
                          if (!isNaN(pid)) applyProduct(i, pid);
                          else updateItem(i, { productId: undefined });
                        }}
                      >
                        <SelectOption value="">—</SelectOption>
                        {products.map((p) => (
                          <SelectOption key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectOption>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                          placeholder="Beschreibung *"
                        />
                        <Input
                          value={item.notes}
                          onChange={(e) => updateItem(i, { notes: e.target.value })}
                          placeholder="Zusatz (optional)"
                          className="text-muted-foreground text-xs"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <NumericInput
                        decimals={1}
                        fallback={1}
                        value={item.quantity}
                        onValueChange={(n) => updateItem(i, { quantity: n || 1 })}
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumericInput
                        decimals={2}
                        fallback={0}
                        value={item.unitPrice}
                        onValueChange={(n) => updateItem(i, { unitPrice: n })}
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{item.total.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveItem(i)}
                        disabled={items.length === 1}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="px-3 py-2.5 font-medium text-right text-sm">
                    Total CHF
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-sm">
                    {grandTotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <PlusIcon className="size-3.5" />
              Position hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
