import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";

export type CustomerFormValues = {
  name: string;
  company: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
};

export const customerFormDefaults: CustomerFormValues = {
  name: "",
  company: "",
  address: "",
  zip: "",
  city: "",
  country: "CH",
  email: "",
  phone: "",
};

function FieldError({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return <p className="mt-0.5 text-xs text-destructive">{errors[0]}</p>;
}

function required(label: string) {
  return ({ value }: { value: string }) =>
    !value?.trim() ? `${label} ist erforderlich` : undefined;
}

export function CustomerForm({
  initial,
  onSubmit,
  isPending,
  submitLabel = "Speichern",
  showCancel = true,
  onCancel,
}: {
  initial?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  isPending: boolean;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const form = useForm({
    defaultValues: { ...customerFormDefaults, ...initial },
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
        validators={{ onBlur: required("Name"), onSubmit: required("Name") }}
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

      <form.Field name="company">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Firma</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="address"
        validators={{ onBlur: required("Adresse"), onSubmit: required("Adresse") }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Adresse *</Label>
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

      <div className="grid grid-cols-3 gap-3">
        <form.Field
          name="zip"
          validators={{ onBlur: required("PLZ"), onSubmit: required("PLZ") }}
        >
          {(field) => (
            <div className="flex flex-col gap-1">
              <Label htmlFor={field.name}>PLZ *</Label>
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
        <form.Field
          name="city"
          validators={{ onBlur: required("Ort"), onSubmit: required("Ort") }}
        >
          {(field) => (
            <div className="col-span-2 flex flex-col gap-1">
              <Label htmlFor={field.name}>Ort *</Label>
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
      </div>

      <form.Field name="country">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Land</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>E-Mail</Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="phone">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={field.name}>Telefon</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

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
