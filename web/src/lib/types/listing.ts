import type { FirestoreDate } from "./firestore";
import type {
  CollectibleCategory,
  CollectibleRarity,
  ListingStatus,
  ListingType,
} from "./enums";

/**
 * Marketplace listing. Mirrors `hb/lib/models/listing.dart`.
 * Firestore collection: `listings`.
 */
export interface Listing {
  id: string;

  sellerId: string;
  sellerName: string;
  sellerAvatarUrl?: string | null;

  instanceId: string;
  collectibleId: string;
  collectibleTitle: string;
  artistId: string;
  artistName: string;
  imageUrl?: string | null;

  editionNumber: number;
  totalEditions: number;
  rarity: CollectibleRarity;
  category: CollectibleCategory;
  evolutionLevel: number;

  listingType: ListingType;
  status: ListingStatus;

  askingPrice?: number | null;
  currency: string;

  description?: string | null;
  tags: string[];

  viewCount: number;
  offerCount: number;
  saveCount: number;

  createdAt?: FirestoreDate | null;
  updatedAt?: FirestoreDate | null;
  expiresAt?: FirestoreDate | null;
  soldAt?: FirestoreDate | null;
  closedByTradeId?: string | null;
}
