"use client";

import { useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { FunctionsError } from "firebase/functions";
import { db } from "@/lib/firebase/client";
import { refundPurchase, type RefundPurchaseResult } from "@/lib/admin/callables";

/**
 * /admin/refunds — Section 15.4.
 *
 * Look up a purchase by id, then issue a Stripe refund through the
 * `refundPurchase` Cloud Function (Section 15.5). The Cloud Function
 * is the authoritative actor — it talks to Stripe, updates the
 * purchase doc, and writes an admin_log entry. This page is just the
 * UI surface.
 */
export default function AdminRefundsPage() {
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    setResultMsg(null);
    setPurchase(null);
    try {
      const snap = await getDoc(doc(db, "purchases", id));
      if (!snap.exists()) {
        setErrorMsg(`No purchase document at purchases/${id}.`);
        return;
      }
      const data = snap.data();
      setPurchase({
        id,
        userId: typeof data.userId === "string" ? data.userId : null,
        collectibleId:
          typeof data.collectibleId === "string" ? data.collectibleId : null,
        collectibleTitle:
          typeof data.collectibleTitle === "string"
            ? data.collectibleTitle
            : null,
        amount:
          typeof data.amount === "number"
            ? data.amount
            : typeof data.pricePaid === "number"
              ? data.pricePaid
              : null,
        currency: typeof data.currency === "string" ? data.currency : null,
        status: typeof data.status === "string" ? data.status : null,
        paymentIntentId:
          typeof data.paymentIntentId === "string"
            ? data.paymentIntentId
            : null,
        refundId: typeof data.refundId === "string" ? data.refundId : null,
        purchaseDate:
          data.purchaseDate instanceof Timestamp
            ? data.purchaseDate.toDate()
            : null,
        refundedAt:
          data.refundedAt instanceof Timestamp
            ? data.refundedAt.toDate()
            : null,
      });
    } catch (err) {
      setErrorMsg(_friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    if (!purchase) return;
    if (
      !window.confirm(
        `Refund purchase ${purchase.id}? This is irreversible — Stripe will return the funds to the buyer.`,
      )
    ) {
      return;
    }
    setRefunding(true);
    setResultMsg(null);
    try {
      const result: RefundPurchaseResult = await refundPurchase({
        purchaseId: purchase.id,
        reason: reason.trim() || undefined,
      });
      setResultMsg(
        result.changed
          ? `Refunded. Stripe refund id: ${result.refundId ?? "(none returned)"}.`
          : `Already refunded; no action taken.`,
      );
      // Reflect the new state in the loaded purchase view.
      setPurchase({
        ...purchase,
        status: "refunded",
        refundId: result.refundId ?? purchase.refundId,
        refundedAt: new Date(),
      });
    } catch (err) {
      setResultMsg(`refundPurchase failed: ${_friendlyError(err)}`);
    } finally {
      setRefunding(false);
    }
  }

  const alreadyRefunded = purchase?.status === "refunded";
  const noPaymentIntent = !!purchase && !purchase.paymentIntentId;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Refunds
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Issue a Stripe refund against a purchase by id. Action is logged
          to <code>admin_log</code> and is not reversible from this UI.
        </p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="purchase id"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      {purchase && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Purchase id" value={purchase.id} mono />
            <Field
              label="Status"
              value={purchase.status ?? "—"}
              tone={alreadyRefunded ? "warn" : "default"}
            />
            <Field label="Buyer uid" value={purchase.userId ?? "—"} mono />
            <Field
              label="Collectible"
              value={purchase.collectibleTitle ?? purchase.collectibleId ?? "—"}
            />
            <Field
              label="Amount"
              value={
                purchase.amount != null
                  ? `${purchase.amount} ${purchase.currency ?? ""}`.trim()
                  : "—"
              }
            />
            <Field
              label="Purchased"
              value={
                purchase.purchaseDate
                  ? purchase.purchaseDate.toLocaleString()
                  : "—"
              }
            />
            <Field
              label="paymentIntentId"
              value={purchase.paymentIntentId ?? "—"}
              mono
              tone={noPaymentIntent ? "warn" : "default"}
            />
            {purchase.refundId && (
              <Field label="Refund id" value={purchase.refundId} mono />
            )}
            {purchase.refundedAt && (
              <Field
                label="Refunded at"
                value={purchase.refundedAt.toLocaleString()}
              />
            )}
          </div>

          {!alreadyRefunded && !noPaymentIntent && (
            <div className="space-y-3 pt-3 border-t border-white/5">
              <label className="block text-xs uppercase tracking-wide text-fg-muted">
                Reason (optional, recorded in admin_log + Stripe metadata)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. user error, duplicate charge"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary"
                autoComplete="off"
              />
              <div>
                <button
                  type="button"
                  onClick={handleRefund}
                  disabled={refunding}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                >
                  {refunding ? "Refunding…" : "Issue refund"}
                </button>
              </div>
            </div>
          )}

          {alreadyRefunded && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              This purchase is already marked refunded. Re-running won&apos;t
              issue a second Stripe refund.
            </div>
          )}

          {noPaymentIntent && !alreadyRefunded && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              No <code>paymentIntentId</code> on this purchase — refund
              isn&apos;t available via this tool. Process manually in the
              Stripe dashboard, then update the purchase doc.
            </div>
          )}

          {resultMsg && (
            <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-fg-strong">
              {resultMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PurchaseRecord {
  id: string;
  userId: string | null;
  collectibleId: string | null;
  collectibleTitle: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  paymentIntentId: string | null;
  refundId: string | null;
  purchaseDate: Date | null;
  refundedAt: Date | null;
}

function Field({
  label,
  value,
  tone = "default",
  mono = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
  mono?: boolean;
}) {
  const valueClass = [
    tone === "warn" ? "text-amber-300 font-medium" : "text-fg-strong",
    mono ? "font-mono break-all" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-fg-muted">
        {label}
      </div>
      <div className={`text-sm ${valueClass}`}>{value}</div>
    </div>
  );
}

function _friendlyError(err: unknown): string {
  if (err instanceof FunctionsError) {
    return `${err.code}: ${err.message}`;
  }
  if (err instanceof FirebaseError) {
    return `${err.code}: ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
