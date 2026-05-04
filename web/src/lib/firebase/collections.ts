/**
 * Firestore collection names. Mirrors hb/lib/models/constants.dart so the
 * Flutter and React clients stay in lockstep. Update both when collections change.
 */
export const Collections = {
  users: "users",
  artists: "artists",
  collectibles: "collectibles",
  collectibleInstances: "collectible_instances",
  purchases: "purchases",
  trades: "trades",
  ownershipHistory: "ownership_history",
  transfers: "transfers",
  priceHistory: "price_history",
  paymentLogs: "payment_logs",
  collections: "collections",
  evolutionRules: "evolution_rules",
  evolutionEvents: "evolution_events",
  xpTransactions: "xp_transactions",
  seasons: "seasons",
  contentBundles: "content_bundles",
  wishlists: "wishlists",
  notifications: "notifications",
  tradeMatches: "trade_matches",
  accessGates: "access_gates",
  tradeMessages: "messages",
  listings: "listings",
  rosters: "rosters",
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
