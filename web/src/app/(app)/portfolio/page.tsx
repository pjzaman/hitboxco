"use client";

import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface InstanceDoc {
  id: string;
  collectibleId?: string;
  collectibleTitle?: string;
  artistId?: string;
  artistName?: string;
  editionNumber?: number;
  totalEditions?: number;
  status?: string;
  rarity?: string;
}

const rarityColor: Record<string, string> = {
  common: "text-rarity-common",
  uncommon: "text-rarity-uncommon",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
  exclusive: "text-rarity-exclusive",
};

export default function PortfolioPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio-instances", user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      const q = query(
        collection(db, Collections.collectibleInstances),
        where("claimedByUserId", "==", user!.uid),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InstanceDoc));
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-fg-strong tracking-tight">Portfolio</h1>
          <p className="mt-2 text-fg-muted">Your verified, evolving collection.</p>
        </div>
        {data && (
          <div className="text-fg-muted text-sm">
            <span className="text-fg-strong text-xl font-bold">{data.length}</span> {data.length === 1 ? "item" : "items"}
          </div>
        )}
      </div>

      {isLoading && <div className="text-fg-muted">Loading your collection…</div>}

      {error && (
        <GlassCard>
          <p className="text-tertiary text-sm font-medium mb-2">Failed to load portfolio</p>
          <p className="text-xs text-fg-muted font-mono break-all">{String(error)}</p>
        </GlassCard>
      )}

      {data && data.length === 0 && (
        <GlassCard className="text-center py-16">
          <h3 className="text-xl font-semibold text-fg-strong mb-2">No collectibles yet</h3>
          <p className="text-fg-muted">Claim your first Hitbox to start building your vault.</p>
        </GlassCard>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((item) => (
            <GlassCard key={item.id} className="hover:bg-surface-2/40 transition-colors">
              <div className="aspect-square rounded-2xl bg-surface-2 mb-4" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-fg-strong font-semibold truncate">
                    {item.collectibleTitle ?? "Untitled"}
                  </div>
                  <div className="text-fg-muted text-sm truncate">{item.artistName ?? "Unknown"}</div>
                </div>
                {item.rarity && (
                  <span className={cn("text-[10px] uppercase tracking-wider font-semibold", rarityColor[item.rarity] ?? "text-fg-muted")}>
                    {item.rarity}
                  </span>
                )}
              </div>
              {item.editionNumber != null && item.totalEditions != null && (
                <div className="mt-3 text-xs text-fg-faint">
                  #{item.editionNumber}/{item.totalEditions}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
