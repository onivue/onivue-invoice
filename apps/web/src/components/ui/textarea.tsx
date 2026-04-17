import { cn } from "@/lib/utils";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "disabled:bg-input/50 min-h-20 w-full border bg-transparent px-2.5 py-1.5",
        "text-xs placeholder:text-muted-foreground focus-visible:ring-1",
        "aria-invalid:ring-1 resize-none outline-none transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
