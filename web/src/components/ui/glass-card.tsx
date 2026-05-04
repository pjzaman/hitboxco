import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass rounded-3xl p-6 transition-all", className)}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
