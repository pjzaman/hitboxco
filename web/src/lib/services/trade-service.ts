import {
  Firestore,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import type { Trade } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/trade_service.dart`.
 *
 * Trades are denormalized: each doc has both `fromUserId` and
 * `toUserId`. To list a user's trades we run two indexed queries
 * in parallel and merge by id, then sort by createdAt desc.
 *
 * Required composite indexes (already in `firestore.indexes.json`):
 *   trades(fromUserId, createdAt desc)
 *   trades(toUserId,   createdAt desc)
 */

const TRADES = Collections.trades;

export async function getTradesForUser(
  uid: string,
  database: Firestore = db,
): Promise<Trade[]> {
  const tradesRef = collection(database, TRADES);
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
  const [fromSnap, toSnap] = await Promise.all([
    getDocs(fromQ),
    getDocs(toQ),
  ]);

  const merged = new Map<string, Trade>();
  for (const d of [...fromSnap.docs, ...toSnap.docs]) {
    merged.set(d.id, { id: d.id, ...(d.data() as Omit<Trade, "id">) });
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTs =
      (a.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
    const bTs =
      (b.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
    return bTs - aTs;
  });
}
