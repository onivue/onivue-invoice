import { cn } from "@/lib/utils";
import * as React from "react";

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex min-h-12 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6",
        className,
      )}
      {...props}
    />
  );
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1 className={cn("font-serif text-base font-medium text-foreground", className)} {...props} />
  );
}

function PageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-250 mx-auto w-full", className)} {...props} />
  );
}

export { PageContent, PageHeader, PageTitle };
