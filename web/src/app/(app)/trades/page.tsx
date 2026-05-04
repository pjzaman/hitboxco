"use client";

import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import { GlassCard } from "@/components/ui/glass-card";

type TradeDoc = Record<string, unknown> & { id: string };

export default function TradesPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-trades", user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      const uid = user!.uid;
      // Trades are denormalized as fromUserId / toUserId.
      // Run two parallel queries and merge — both indexes already exist
      // (firestore.indexes.json: trades by fromUserId+createdAt and toUserId+createdAt).
      const tradesRef = collection(db, Collections.trades);
      const fromQ = query(
        tradesRef,
        where("fromUserId", "==", uid),
        orderBy("createdAt", "desc"),
      );
      const toQ = query(
        tradesRef,
        where("toUserId", "==", uid),
        orderBy("createdAt", "desc"),
      );
      const [fromSnap, toSnap] = await Promise.all([getDocs(fromQ), getDocs(toQ)]);
      const map = new Map<string, TradeDoc>();
      [...fromSnap.docs, ...toSnap.docs].forEach((d) => {
        map.set(d.id, { id: d.id, ...d.data() });
      });
      return Array.from(map.values()).sort((a, b) => {
        const aTs = (a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
        const bTs = (b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
        return bTs - aTs;
      });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-fg-strong tracking-tight">Trades</h1>
        <p className="mt-2 text-fg-muted">Open offers, in-progress trades, and history.</p>
      </div>

      {isLoading && <div className="text-fg-muted">Loading trades…</div>}

      {error && (
        <GlassCard>
          <p className="text-tertiary text-sm">Failed to load: {String(error)}</p>
        </GlassCard>
      )}

      {data && data.length === 0 && (
        <GlassCard className="text-center py-16">
          <h3 className="text-xl font-semibold text-fg-strong mb-2">No trades yet</h3>
          <p className="text-fg-muted">Make an offer on a marketplace listing to get started.</p>
        </GlassCard>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((t) => (
            <GlassCard key={t.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-fg-strong font-medium">
                    Trade {t.id.slice(0, 8)}
                  </div>
                  <div className="text-sm text-fg-muted">
                    {t.fromUserId === user?.uid ? "You → " : "← "} 
                    {t.toUserId === user?.uid ? " You" : ""}
                  </div>
                </div>
                <span className="text-xs uppercase tracking-wider text-fg-faint px-3 py-1 rounded-full bg-surface-2">
                  {String(t.status ?? "—")}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
