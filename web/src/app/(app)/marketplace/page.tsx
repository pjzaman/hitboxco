"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { Filter, Search } from "lucide-react";

interface ListingDoc {
  id: string;
  sellerId?: string;
  sellerName?: string;
  collectibleTitle?: string;
  artistName?: string;
  imageUrl?: string;
  rarity?: string;
  listingType?: string;
  askingPrice?: number;
  currency?: string;
  editionNumber?: number;
  totalEditions?: number;
}

const rarityColor: Record<string, string> = {
  common: "text-rarity-common",
  uncommon: "text-rarity-uncommon",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
  exclusive: "text-rarity-exclusive",
};

export default function MarketplacePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      const q = query(
        collection(db, Collections.listings),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(24),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ListingDoc));
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-fg-strong tracking-tight">Marketplace</h1>
          <p className="mt-2 text-fg-muted">Discover, trade, and hunt for the rare ones.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" shape="pill">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button variant="ghost" size="md" shape="pill">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-fg-muted">Loading listings…</div>}

      {error && (
        <GlassCard>
          <p className="text-tertiary text-sm font-medium mb-2">Failed to load listings</p>
          <p className="text-xs text-fg-muted font-mono break-all">{String(error)}</p>
          <p className="mt-3 text-sm text-fg-muted">
            If this is a permission error, deploy the updated Firestore rules from <code className="text-primary">hb/</code> with <code className="text-primary">firebase deploy --only firestore:rules,firestore:indexes</code>.
          </p>
        </GlassCard>
      )}

      {data && data.length === 0 && (
        <GlassCard className="text-center py-16">
          <h3 className="text-xl font-semibold text-fg-strong mb-2">No active listings</h3>
          <p className="text-fg-muted">Check back soon — collectors are listing daily.</p>
        </GlassCard>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.map((listing) => (
            <GlassCard key={listing.id} className="hover:bg-surface-2/40 transition-colors">
              <div className="aspect-square rounded-2xl bg-surface-2 mb-4 overflow-hidden">
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt={listing.collectibleTitle ?? "Collectible"}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-fg-strong font-semibold truncate">
                    {listing.collectibleTitle ?? "Untitled"}
                  </div>
                  <div className="text-fg-muted text-sm truncate">
                    {listing.artistName ?? listing.sellerName ?? "Unknown"}
                  </div>
                </div>
                {listing.rarity && (
                  <span className={cn("text-[10px] uppercase tracking-wider font-semibold", rarityColor[listing.rarity] ?? "text-fg-muted")}>
                    {listing.rarity}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-primary font-semibold">
                  {listing.askingPrice != null
                    ? formatCurrency(listing.askingPrice, listing.currency ?? "USD")
                    : "Trade only"}
                </span>
                {listing.editionNumber != null && listing.totalEditions != null && (
                  <span className="text-xs text-fg-faint">
                    #{listing.editionNumber}/{listing.totalEditions}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
