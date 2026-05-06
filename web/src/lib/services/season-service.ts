import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  query,
  where,
} from "firebase/firestore";
import { Collections } from "@/lib/firebase/collections";
import type { Season } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/season_service.dart`.
 *
 * Used by the public SEO route `/season/[id]`. Same id-or-slug
 * resolution as the artist service.
 */

const SEASONS = Collections.seasons;

export async function getSeasonByIdOrSlug(
  database: Firestore,
  idOrSlug: string,
): Promise<Season | null> {
  try {
    const direct = await getDoc(doc(database, SEASONS, idOrSlug));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as Omit<Season, "id">) };
    }
    const bySlug = await getDocs(
      query(
        collection(database, SEASONS),
        where("slug", "==", idOrSlug),
        fbLimit(1),
      ),
    );
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return { id: d.id, ...(d.data() as Omit<Season, "id">) };
    }
    return null;
  } catch {
    return null;
  }
}
