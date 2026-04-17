import { Input } from "@/components/ui/input";
import * as React from "react";

type Props = {
  value: number;
  onValueChange: (n: number) => void;
  decimals?: number;
  fallback?: number;
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">;

export function NumericInput({ value, onValueChange, decimals = 0, fallback = 0, onBlur, ...props }: Props) {
  const [raw, setRaw] = React.useState(String(value));
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setRaw(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value;
    if (decimals > 0) {
      v = v.replace(/[^0-9.]/g, "");
      const parts = v.split(".");
      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
      if (parts[1] !== undefined && parts[1].length > decimals) {
        v = parts[0] + "." + parts[1].slice(0, decimals);
      }
    } else {
      v = v.replace(/[^0-9]/g, "");
    }
    setRaw(v);
    const parsed = decimals > 0 ? parseFloat(v) : parseInt(v, 10);
    if (!isNaN(parsed)) onValueChange(parsed);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    focused.current = false;
    const parsed = decimals > 0 ? parseFloat(raw) : parseInt(raw, 10);
    const valid = isNaN(parsed) || parsed < 0 ? fallback : parsed;
    setRaw(String(valid));
    onValueChange(valid);
    (onBlur as React.FocusEventHandler<HTMLInputElement> | undefined)?.(e);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      value={raw}
      onChange={handleChange}
      onFocus={() => { focused.current = true; }}
      onBlur={handleBlur}
    />
  );
}
