import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Collections } from "@/lib/firebase/collections";
import type { Collectible } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/collectible_catalog_service.dart`.
 *
 * Reads against `collectibles`. Used by the public SEO routes
 * `/drop/[id]` and `/artist/[id]` (the latter for active drops).
 */

const COLLECTIBLES = Collections.collectibles;

export async function getCollectible(
  database: Firestore,
  id: string,
): Promise<Collectible | null> {
  try {
    const snap = await getDoc(doc(database, COLLECTIBLES, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Collectible, "id">) };
  } catch {
    return null;
  }
}

/**
 * Active drops for an artist, newest first. Capped at `max` rows.
 *
 * Index requirement: `collectibles` (artistId, isActive, releaseDate desc).
 * That composite index is in `hb/firestore.indexes.json` under the
 * collectibles collection.
 */
export async function getActiveDropsByArtist(
  database: Firestore,
  artistId: string,
  max = 12,
): Promise<Collectible[]> {
  try {
    const snap = await getDocs(
      query(
        collection(database, COLLECTIBLES),
        where("artistId", "==", artistId),
        where("isActive", "==", true),
        orderBy("releaseDate", "desc"),
        fbLimit(max),
      ),
    );
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Collectible, "id">),
    }));
  } catch {
    return [];
  }
}
