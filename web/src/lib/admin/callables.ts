"use client";

import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions } from "@/lib/firebase/client";

/**
 * Typed client wrappers around the admin Cloud Functions deployed in
 * `hb/functions/admin.js` (Section 15.5). Every wrapper:
 *
 *   • Generates a fresh idempotency key per invocation (UUID v4 via
 *     `crypto.randomUUID`) so retried network calls don't double-apply.
 *   • Returns the result object the Cloud Function sent back, with the
 *     shape narrowed for ergonomics on the calling page.
 *
 * The Cloud Functions themselves enforce the admin custom claim. The
 * (admin) layout's claim check is just UX defense in depth — the server
 * is authoritative.
 */

function _newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers — admin web targets evergreen, so this
  // path is unlikely. Length matches UUID for log consistency.
  return `idem-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

async function _call<TIn extends object, TOut>(
  name: string,
  payload: TIn,
): Promise<TOut> {
  const callable = httpsCallable<
    TIn & { idempotencyKey: string },
    TOut
  >(functions, name);
  const res: HttpsCallableResult<TOut> = await callable({
    ...payload,
    idempotencyKey: _newIdempotencyKey(),
  });
  return res.data;
}

// ── setAdmin ──────────────────────────────────────────────────────────
export interface SetAdminInput {
  uid: string;
}
export interface SetAdminResult {
  uid: string;
  hasAdmin: boolean;
  changed: boolean;
}
export function setAdmin(input: SetAdminInput): Promise<SetAdminResult> {
  return _call<SetAdminInput, SetAdminResult>("setAdmin", input);
}

// ── revokeAdmin ───────────────────────────────────────────────────────
export interface RevokeAdminInput {
  uid: string;
}
export interface RevokeAdminResult {
  uid: string;
  hasAdmin: boolean;
  changed: boolean;
}
export function revokeAdmin(
  input: RevokeAdminInput,
): Promise<RevokeAdminResult> {
  return _call<RevokeAdminInput, RevokeAdminResult>("revokeAdmin", input);
}

// ── refundPurchase ────────────────────────────────────────────────────
export interface RefundPurchaseInput {
  purchaseId: string;
  reason?: string;
}
export interface RefundPurchaseResult {
  purchaseId: string;
  refundId: string | null;
  status: "refunded";
  changed: boolean;
}
export function refundPurchase(
  input: RefundPurchaseInput,
): Promise<RefundPurchaseResult> {
  return _call<RefundPurchaseInput, RefundPurchaseResult>(
    "refundPurchase",
    input,
  );
}

// ── banUser ───────────────────────────────────────────────────────────
export interface BanUserInput {
  uid: string;
  reason?: string;
}
export interface BanUserResult {
  uid: string;
  banned: boolean;
  changed: boolean;
}
export function banUser(input: BanUserInput): Promise<BanUserResult> {
  return _call<BanUserInput, BanUserResult>("banUser", input);
}

// ── createFeedEvent / archiveFeedEvent ────────────────────────────────
export type FeedEventType = "post" | "banner" | "drop_release" | "announcement";
export type FeedEventAudience = "all" | "followers";

export interface CreateFeedEventInput {
  type: FeedEventType;
  audience?: FeedEventAudience;
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  collectibleId?: string | null;
  authorId?: string | null;
  authorType?: "system" | "artist" | "user";
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  publishAtMs?: number | null;
  expiresAtMs?: number | null;
}
export interface CreateFeedEventResult {
  id: string;
  status: "published";
}
export function createFeedEvent(
  input: CreateFeedEventInput,
): Promise<CreateFeedEventResult> {
  return _call<CreateFeedEventInput, CreateFeedEventResult>(
    "createFeedEvent",
    input,
  );
}

export interface ArchiveFeedEventInput {
  feedEventId: string;
  reason?: string;
}
export interface ArchiveFeedEventResult {
  id: string;
  status: "archived";
  changed: boolean;
}
export function archiveFeedEvent(
  input: ArchiveFeedEventInput,
): Promise<ArchiveFeedEventResult> {
  return _call<ArchiveFeedEventInput, ArchiveFeedEventResult>(
    "archiveFeedEvent",
    input,
  );
}

// ── actionReport / dismissReport ──────────────────────────────────────
export interface ReportDecisionInput {
  reportId: string;
  note?: string;
}
export interface ReportDecisionResult {
  reportId: string;
  status: "actioned" | "dismissed" | "open";
  changed: boolean;
}
export function actionReport(
  input: ReportDecisionInput,
): Promise<ReportDecisionResult> {
  return _call<ReportDecisionInput, ReportDecisionResult>(
    "actionReport",
    input,
  );
}
export function dismissReport(
  input: ReportDecisionInput,
): Promise<ReportDecisionResult> {
  return _call<ReportDecisionInput, ReportDecisionResult>(
    "dismissReport",
    input,
  );
}
