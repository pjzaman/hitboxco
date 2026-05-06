/**
 * String-literal mirrors of the Dart enums in `hb/lib/models/enums.dart`.
 *
 * Flutter's json_serializable encodes enums by their identifier name
 * (camelCase) by default, and the Firestore docs are written that way.
 * Keep these unions in lockstep with the Dart enums — adding a new
 * variant on one side without the other will produce silent reads.
 */

export type CollectibleCategory =
  | "cardPack"
  | "figure"
  | "vinyl"
  | "merch"
  | "digitalAsset";

export type CollectibleRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "exclusive";

export type CollectionType =
  | "userCollection"
  | "officialSet"
  | "seasonalSet"
  | "eventSet";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type ClaimStatus = "pending_claim" | "claimed" | "expired";

export type InstanceStatus =
  | "available"
  | "reserved"
  | "claimed"
  | "unclaimed"
  | "listed";

export type TradeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "countered"
  | "expired"
  | "cancelled";

export type OfferType = "collectibleSwap" | "cashOffer";

export type WishlistPriority = "low" | "medium" | "high";

export type ListingType = "forSale" | "forTrade" | "forSaleOrTrade";

export type ListingStatus =
  | "active"
  | "sold"
  | "traded"
  | "cancelled"
  | "expired";
