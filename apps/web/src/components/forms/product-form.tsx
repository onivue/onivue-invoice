import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@tanstack/react-form";

export type ProductFormValues = {
  name: string;
  description: string;
  defaultPrice: number;
  unit: "Stk" | "Std" | "Pauschal";
};

export const productFormDefaults: ProductFormValues = {
  name: "",
  description: "",
  defaultPrice: 0,
  unit: "Stk",
};

function FieldError({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return <p className="mt-0.5 text-xs text-destructive">{errors[0]}</p>;
}

export function ProductForm({
  initial,
  onSubmit,
  isPending,
  submitLabel = "Speichern",
  showCancel = true,
  onCancel,
}: {
  initial?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isPending: boolean;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const form = useForm({
    defaultValues: { ...productFormDefaults, ...initial },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <form.Field
        name="name"
        validators={{
          onBlur: ({ value }) => !value?.trim() ? "Name ist erforderlich" : undefined,
          onSubmit: ({ value }) => !value?.trim() ? "Name ist erforderlich" : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Name *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError errors={field.state.meta.errors as string[]} />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Beschreibung</Label>
            <Textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="defaultPrice"
          validators={{
            onSubmit: ({ value }) => value < 0 ? "Preis darf nicht negativ sein" : undefined,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>Standardpreis (CHF) *</Label>
              <NumericInput
                id={field.name}
                decimals={2}
                fallback={0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onValueChange={(n) => field.handleChange(n)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError errors={field.state.meta.errors as string[]} />
            </div>
          )}
        </form.Field>

        <form.Field name="unit">
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>Einheit *</Label>
              <Select
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value as "Stk" | "Std" | "Pauschal")}
              >
                <SelectOption value="Stk">Stk</SelectOption>
                <SelectOption value="Std">Std</SelectOption>
                <SelectOption value="Pauschal">Pauschal</SelectOption>
              </Select>
            </div>
          )}
        </form.Field>
      </div>

      <DialogFooter>
        {showCancel &&
          (onCancel ? (
            <Button variant="outline" type="button" onClick={onCancel}>
              Abbrechen
            </Button>
          ) : (
            <DialogClose render={<Button variant="outline" type="button" />}>Abbrechen</DialogClose>
          ))}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Speichern..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
