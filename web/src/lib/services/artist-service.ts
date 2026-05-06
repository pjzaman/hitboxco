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
import type { Artist } from "@/lib/types";

/**
 * Mirrors `hb/lib/services/artist_service.dart`.
 *
 * The artist-page lookup accepts either the Firestore doc id or a
 * `slug` field. Doc-id lookup runs first (single point read);
 * slug query is the fallback. Used by the public SEO route
 * `/artist/[id]` (server component) and admin tooling.
 */

const ARTISTS = Collections.artists;

export async function getArtistByIdOrSlug(
  database: Firestore,
  idOrSlug: string,
): Promise<Artist | null> {
  try {
    const direct = await getDoc(doc(database, ARTISTS, idOrSlug));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as Omit<Artist, "id">) };
    }
    const bySlug = await getDocs(
      query(
        collection(database, ARTISTS),
        where("slug", "==", idOrSlug),
        fbLimit(1),
      ),
    );
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return { id: d.id, ...(d.data() as Omit<Artist, "id">) };
    }
    return null;
  } catch {
    return null;
  }
}
