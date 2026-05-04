"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl bg-surface-2 px-4 text-fg-strong placeholder:text-fg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "transition-colors duration-200",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
