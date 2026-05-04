"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-surface-0 hover:bg-primary/90 hover:shadow-[0_0_24px_-6px_var(--primary)]",
        secondary:
          "bg-surface-2 text-fg-strong hover:bg-surface-3",
        ghost:
          "bg-transparent text-fg hover:bg-surface-2 hover:text-fg-strong",
        outline:
          "bg-transparent text-fg-strong border border-hairline hover:bg-surface-2",
        tertiary:
          "bg-tertiary text-surface-0 hover:bg-tertiary/90 hover:shadow-[0_0_24px_-6px_var(--tertiary)]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
      shape: {
        pill: "rounded-full",
        card: "rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "pill",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
