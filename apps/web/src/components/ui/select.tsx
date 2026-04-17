import { cn } from "@/lib/utils";
import * as React from "react";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "disabled:bg-input/50 h-8 w-full border bg-transparent px-2.5 py-1",
        "text-xs focus-visible:ring-1 aria-invalid:ring-1 outline-none",
        "transition-colors cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function SelectOption({ ...props }: React.ComponentProps<"option">) {
  return <option {...props} />;
}

export { Select, SelectOption };
