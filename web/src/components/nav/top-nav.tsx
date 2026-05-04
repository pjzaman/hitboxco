"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, Search, User as UserIcon } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/feed", label: "Feed" },
  { href: "/trades", label: "Trades" },
];

export function TopNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40">
      <div className="glass mx-4 mt-4 rounded-full px-4 py-2 flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-secondary to-tertiary glow-primary" />
          <span className="font-bold tracking-tight text-fg-strong">Hitbox</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-2 text-fg-strong"
                    : "text-fg-muted hover:text-fg-strong hover:bg-surface-2/50",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => router.push("/login")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
