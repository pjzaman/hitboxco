import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Collections } from "@/lib/firebase/collections";
import type { CollectibleInstance } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/portfolio_service.dart`.
 *
 * A user's portfolio is the set of `collectible_instances` whose
 * `claimedByUserId` field matches their uid. Reads are gated by
 * Firestore rules to the owner.
 */

const INSTANCES = Collections.collectibleInstances;

export async function getInstancesForUser(
  uid: string,
  database: Firestore = db,
): Promise<CollectibleInstance[]> {
  const snap = await getDocs(
    query(
      collection(database, INSTANCES),
      where("claimedByUserId", "==", uid),
    ),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CollectibleInstance, "id">),
  }));
}
