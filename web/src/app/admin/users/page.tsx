"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { FunctionsError } from "firebase/functions";
import { db } from "@/lib/firebase/client";
import {
  setAdmin,
  revokeAdmin,
  type SetAdminResult,
  type RevokeAdminResult,
} from "@/lib/admin/callables";

/**
 * /admin/users — Section 15.4 first usable page.
 *
 * Functionality this pass:
 *   • Look up a single user by uid (Firestore `users/{uid}` doc).
 *   • Grant or revoke the `admin` Auth custom claim via the deployed
 *     Cloud Functions.
 *
 * Out of scope (follow-up): full user list with pagination/search by
 * email, ban/unban, role assignment beyond admin (Section 15.8).
 */
export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "setAdmin" | "revokeAdmin" | null
  >(null);
  const [actionResultMsg, setActionResultMsg] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const uid = query.trim();
    if (!uid) return;
    setLoading(true);
    setErrorMsg(null);
    setActionResultMsg(null);
    setUser(null);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        setErrorMsg(`No user document at users/${uid}.`);
        return;
      }
      const data = snap.data();
      setUser({
        uid,
        email: typeof data.email === "string" ? data.email : null,
        displayName:
          typeof data.displayName === "string" ? data.displayName : null,
        banned: data.banned === true,
      });
    } catch (err) {
      setErrorMsg(_friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSetAdmin() {
    if (!user) return;
    setPendingAction("setAdmin");
    setActionResultMsg(null);
    try {
      const result: SetAdminResult = await setAdmin({ uid: user.uid });
      setActionResultMsg(
        result.changed
          ? `Granted admin to ${user.uid}. They must sign out and back in to refresh their token.`
          : `${user.uid} already has admin.`,
      );
    } catch (err) {
      setActionResultMsg(`setAdmin failed: ${_friendlyError(err)}`);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevokeAdmin() {
    if (!user) return;
    if (
      !window.confirm(
        `Revoke admin from ${user.uid}? They lose access at next token refresh.`,
      )
    ) {
      return;
    }
    setPendingAction("revokeAdmin");
    setActionResultMsg(null);
    try {
      const result: RevokeAdminResult = await revokeAdmin({ uid: user.uid });
      setActionResultMsg(
        result.changed
          ? `Revoked admin from ${user.uid}.`
          : `${user.uid} did not have admin.`,
      );
    } catch (err) {
      setActionResultMsg(`revokeAdmin failed: ${_friendlyError(err)}`);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Users
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Look up a user by uid, then grant or revoke the{" "}
          <code>admin</code> custom claim.
        </p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="user uid"
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

      {user && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-fg-muted">
              uid
            </div>
            <div className="font-mono text-sm text-fg-strong break-all">
              {user.uid}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" value={user.email ?? "—"} />
            <Field label="Display name" value={user.displayName ?? "—"} />
            <Field
              label="Banned"
              value={user.banned ? "yes" : "no"}
              tone={user.banned ? "warn" : "default"}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleSetAdmin}
              disabled={pendingAction !== null}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {pendingAction === "setAdmin" ? "Granting…" : "Grant admin"}
            </button>
            <button
              type="button"
              onClick={handleRevokeAdmin}
              disabled={pendingAction !== null}
              className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-fg-strong transition-opacity disabled:opacity-50"
            >
              {pendingAction === "revokeAdmin" ? "Revoking…" : "Revoke admin"}
            </button>
          </div>

          {actionResultMsg && (
            <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-fg-strong">
              {actionResultMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface UserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  banned: boolean;
}

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  const valueClass =
    tone === "warn" ? "text-amber-300 font-medium" : "text-fg-strong";
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
