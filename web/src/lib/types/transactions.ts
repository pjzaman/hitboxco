import type { FirestoreDate } from "./firestore";
import type {
  ClaimStatus,
  OfferType,
  PaymentStatus,
  TradeStatus,
} from "./enums";

/**
 * Mirrors `hb/lib/models/transactions.dart` — Purchase + Trade.
 * Firestore collections: `purchases`, `trades`.
 */

export interface Purchase {
  id: string;
  userId: string;
  userName: string;
  collectibleId: string;
  collectibleTitle: string;
  artistId: string;
  artistName: string;

  editionNumber?: number | null;
  totalEditions?: number | null;

  pricePaid: number;
  currency: string;

  purchaseDate?: FirestoreDate | null;
  transactionId: string;

  paymentStatus: PaymentStatus;
  claimStatus: ClaimStatus;

  instanceId?: string | null;
  ownershipToken?: string | null;
  blockchainTxHash?: string | null;

  claimedAt?: FirestoreDate | null;
  expiresAt?: FirestoreDate | null;

  isListed: boolean;
  listPrice?: number | null;
  isTransferable: boolean;

  lastTransferDate?: FirestoreDate | null;

  /** Stripe paymentIntent id used by the admin refund flow. */
  paymentIntentId?: string | null;
  refundedAt?: FirestoreDate | null;

  metadata?: Record<string, unknown>;
}

export interface Trade {
  id: string;

  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;

  offerType: OfferType;

  fromInstanceId?: string | null;
  toInstanceId: string;

  cashAmount?: number | null;
  currency?: string | null;

  status: TradeStatus;

  createdAt?: FirestoreDate | null;
  updatedAt?: FirestoreDate | null;
  expiresAt?: FirestoreDate | null;

  counterOfferId?: string | null;
  parentTradeId?: string | null;

  fromCollectibleTitle?: string | null;
  fromArtistName?: string | null;
  fromEditionNumber?: number | null;
  fromCollectibleImageUrl?: string | null;

  toCollectibleTitle: string;
  toArtistName: string;
  toEditionNumber: number;
  toCollectibleImageUrl?: string | null;

  paymentIntentId?: string | null;
  paymentStatus?: string | null;
  paidAt?: FirestoreDate | null;

  acceptedAt?: FirestoreDate | null;
  completedAt?: FirestoreDate | null;

  messageCount: number;
}
