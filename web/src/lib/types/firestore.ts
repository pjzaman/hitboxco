import { Timestamp } from "firebase/firestore";

/**
 * Firestore Timestamps come back as `Timestamp` objects from the SDK.
 * Server-rendered code paths sometimes pass them through Next.js
 * serialization, where they'll arrive as `{seconds, nanoseconds}` plain
 * objects. The union here covers both shapes so type consumers can
 * accept either without an extra cast.
 */
export type FirestoreDate =
  | Timestamp
  | { seconds: number; nanoseconds: number };

/** Convert a Firestore Timestamp (or serialized form) to a JS Date. */
export function toDate(value: FirestoreDate | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "object" && "seconds" in value) {
    return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
  }
  return null;
}

/** Format a Firestore date as a short readable string, or empty string if null. */
export function formatDate(
  value: FirestoreDate | null | undefined,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString(undefined, opts) : "";
}
