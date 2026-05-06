import {
  Firestore,
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import type { Listing } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/marketplace_service.dart`.
 *
 * The web marketplace currently shows the most recent active listings;
 * search and filtering happen client-side. Server-side filters can land
 * here as the catalog grows.
 */

const LISTINGS = Collections.listings;

export async function getActiveListings(
  max = 24,
  database: Firestore = db,
): Promise<Listing[]> {
  const snap = await getDocs(
    query(
      collection(database, LISTINGS),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      fbLimit(max),
    ),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Listing, "id">),
  }));
}
