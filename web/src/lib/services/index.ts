/**
 * Service-layer barrel export. Each service module mirrors the
 * Flutter equivalent under `hb/lib/services/` and centralizes
 * Firestore queries that were previously inlined in page components.
 *
 * Add new exports as you port more screens from Flutter.
 */

export * from "./user-service";
export * from "./artist-service";
export * from "./collectible-catalog-service";
export * from "./season-service";
export * from "./marketplace-service";
export * from "./portfolio-service";
export * from "./trade-service";
