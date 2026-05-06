/**
 * Barrel export for shared Firestore-document types.
 *
 * Mirrors `hb/lib/models/models.dart` so the Flutter and Next.js
 * clients carry the same type names. Firestore field names follow
 * Flutter's json_serializable defaults (camelCase) — keep both sides
 * in lockstep when adding fields.
 */

export * from "./enums";
export * from "./firestore";
export * from "./user";
export * from "./catalog";
export * from "./listing";
export * from "./transactions";
export * from "./platform";
