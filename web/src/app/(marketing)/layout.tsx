import type { ReactNode } from "react";
import { PublicHeader, PublicFooter } from "@/components/public/chrome";

/**
 * Shared layout for the (marketing) route group: /about, /legal/*.
 *
 * The root homepage at `app/page.tsx` keeps its own custom hero header
 * and is intentionally outside this group. Once we want a unified
 * marketing chrome across everything we'd move that page in here too.
 */
export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
