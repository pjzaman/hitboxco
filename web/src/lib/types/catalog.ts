import type { FirestoreDate } from "./firestore";
import type {
  CollectibleCategory,
  CollectibleRarity,
  InstanceStatus,
} from "./enums";

/**
 * Mirrors `hb/lib/models/catalog.dart` — Artist, Collectible,
 * CollectibleInstance, plus their embedded value objects.
 *
 * Firestore collections: `artists`, `collectibles`, `collectible_instances`.
 */

export interface SocialLinks {
  spotify?: string | null;
  appleMusic?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  discord?: string | null;
  website?: string | null;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  genre?: string | null;
  socialLinks?: SocialLinks;
  followersCount: number;
  totalItems: number;
  totalSets: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: FirestoreDate | null;
  lastDropDate?: FirestoreDate | null;
  tags: string[];

  /** Optional URL slug. Layer-4 routes accept either id or slug. */
  slug?: string | null;

  // Backward-compatible flat social fields some old artist docs still carry.
  websiteUrl?: string | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
}

export interface Collectible {
  id: string;
  artistId: string;
  artistName?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  price: number;
  currency: string;
  totalSupply: number;
  minted: number;
  releaseDate?: FirestoreDate | null;
  endDate?: FirestoreDate | null;
  tags: string[];
  metadata?: Record<string, unknown>;
  isActive: boolean;
  rarityScore: number;
  contractAddress?: string | null;
  tokenIdRange?: string | null;
  downloadCount: number;
  averageRating: number;
  reviewCount: number;
  rarity: CollectibleRarity;
  category: CollectibleCategory;
  createdAt?: FirestoreDate | null;
  purchaseCount: number;
  availableForPurchase: number;
  isFeatured: boolean;
}

export interface VisualChange {
  borderColor?: string | null;
  animation?: string | null;
  badge?: string | null;
  overlayUrl?: string | null;
  backgroundColor?: string | null;
}

export interface CollectibleInstance {
  id: string;
  collectibleId: string;
  collectibleTitle: string;
  artistId: string;
  artistName: string;
  editionNumber: number;
  totalEditions: number;

  nfcUid: string;
  ownershipToken: string;
  blockchainTxHash: string;
  registeredAt?: FirestoreDate | null;

  status: InstanceStatus;
  claimedByUserId?: string | null;
  claimedByUserName?: string | null;
  claimedAt?: FirestoreDate | null;

  purchaseId?: string | null;
  orderId?: string | null;
  thumbnailUrl?: string | null;

  evolutionLevel: number;
  evolutionXP: number;
  maxEvolutionLevel: number;
  isEvolutionLocked: boolean;
  lastEvolvedAt?: FirestoreDate | null;
  visualState?: VisualChange;

  tradeCount: number;
  uniqueTradePartners: string[];

  rarity?: CollectibleRarity;
  metadata?: Record<string, unknown>;
}
