import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border-border",
        created: "bg-amber-50 text-amber-700 border-amber-200",
        sent: "bg-blue-50 text-blue-700 border-blue-200",
        paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
