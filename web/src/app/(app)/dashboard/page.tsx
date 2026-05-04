"use client";

import { useAuth } from "@/contexts/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Wallet } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = user?.displayName ? `, ${user.displayName.split(" ")[0]}` : "";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-fg-strong tracking-tight">
          Welcome back<span className="gradient-text">{greeting}</span>.
        </h1>
        <p className="mt-3 text-fg-muted text-lg">
          Here&apos;s what&apos;s happening in your vault today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <span className="text-fg-muted text-sm">Portfolio value</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-fg-strong">—</div>
          <div className="text-xs text-fg-faint mt-1">Connect collectibles to populate</div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <span className="text-fg-muted text-sm">XP this season</span>
            <Sparkles className="h-4 w-4 text-tertiary" />
          </div>
          <div className="text-3xl font-bold text-fg-strong">0</div>
          <div className="text-xs text-fg-faint mt-1">Trade and engage to earn</div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <span className="text-fg-muted text-sm">Active listings</span>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-3xl font-bold text-fg-strong">0</div>
          <div className="text-xs text-fg-faint mt-1">Across the marketplace</div>
        </GlassCard>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/portfolio">
          <GlassCard className="hover:bg-surface-2/40 cursor-pointer group">
            <h3 className="text-xl font-semibold text-fg-strong mb-2">Your portfolio</h3>
            <p className="text-fg-muted">View your collection, holdings, and provenance.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
              Open portfolio <ArrowRight className="h-4 w-4" />
            </div>
          </GlassCard>
        </Link>
        <Link href="/marketplace">
          <GlassCard className="hover:bg-surface-2/40 cursor-pointer group">
            <h3 className="text-xl font-semibold text-fg-strong mb-2">Marketplace</h3>
            <p className="text-fg-muted">Browse listings, find trades, hunt the rare ones.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
              Browse marketplace <ArrowRight className="h-4 w-4" />
            </div>
          </GlassCard>
        </Link>
      </div>

      <div className="text-sm text-fg-faint">
        <strong className="text-fg-muted">User:</strong> {user?.email} · uid {user?.uid?.slice(0, 8)}…
      </div>
    </div>
  );
}
