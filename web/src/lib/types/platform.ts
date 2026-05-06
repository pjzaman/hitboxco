import type { FirestoreDate } from "./firestore";

/**
 * Season — used by `/season/[id]` SEO page and admin tooling.
 * Mirrors a subset of `hb/lib/models/platform.dart` (Season class).
 * Firestore collection: `seasons`.
 */
export interface Season {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  startDate?: FirestoreDate | null;
  endDate?: FirestoreDate | null;
  isActive: boolean;
}
