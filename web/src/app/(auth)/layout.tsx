import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen ambient-backdrop flex flex-col">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-secondary to-tertiary glow-primary" />
          <span className="font-bold tracking-tight text-fg-strong">Hitbox</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
