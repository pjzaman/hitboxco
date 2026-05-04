"use client";

import { useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";
import { FunctionsError } from "firebase/functions";
import { db } from "@/lib/firebase/client";
import {
  actionReport,
  dismissReport,
  type ReportDecisionResult,
} from "@/lib/admin/callables";

/**
 * /admin/moderation — Section 15.4 / 15.7.
 *
 * Lists open `reports` (status == 'open'), with **Action** and
 * **Dismiss** buttons that hit the `actionReport` / `dismissReport`
 * Cloud Functions. Both decisions write an `admin_log` entry; rules
 * disallow client-side updates of report docs.
 *
 * The actual mitigation (banning the reported user, hiding the listing,
 * etc.) is performed separately on the matching admin page —
 * /admin/users for ban, future /admin/listings for hide. "Action"
 * here is the bookkeeping flip; the moderator does the rest by hand
 * for now.
 */
const QUEUE_LIMIT = 50;

interface OpenReport {
  id: string;
  reporter: string;
  targetType: string;
  targetId: string;
  reason: string;
  evidence: string[] | null;
  createdAt: Date | null;
}

function _toReport(snap: QueryDocumentSnapshot<DocumentData>): OpenReport {
  const d = snap.data();
  const ts = d.createdAt;
  return {
    id: snap.id,
    reporter: typeof d.reporter === "string" ? d.reporter : "",
    targetType: typeof d.targetType === "string" ? d.targetType : "—",
    targetId: typeof d.targetId === "string" ? d.targetId : "",
    reason: typeof d.reason === "string" ? d.reason : "",
    evidence: Array.isArray(d.evidence) ? d.evidence.map(String) : null,
    createdAt:
      ts instanceof Timestamp ? ts.toDate() : ts instanceof Date ? ts : null,
  };
}

export default function AdminModerationPage() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const queryResult = useQuery<OpenReport[]>({
    queryKey: ["reports", "open"],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, "reports"),
          where("status", "==", "open"),
          orderBy("createdAt", "asc"),
          limit(QUEUE_LIMIT),
        ),
      );
      return snap.docs.map(_toReport);
    },
  });

  async function decide(
    reportId: string,
    decision: "action" | "dismiss",
  ): Promise<void> {
    const note = (notesById[reportId] ?? "").trim() || undefined;
    const verb = decision === "action" ? "Action" : "Dismiss";
    if (
      !window.confirm(
        `${verb} report ${reportId}?${note ? `\n\nNote: ${note}` : ""}`,
      )
    ) {
      return;
    }
    setPendingId(reportId);
    setFeedback(null);
    try {
      const fn = decision === "action" ? actionReport : dismissReport;
      const result: ReportDecisionResult = await fn({ reportId, note });
      setFeedback(
        result.changed
          ? `${verb}ed ${reportId}.`
          : `${reportId} was already ${result.status}.`,
      );
      await queryResult.refetch();
    } catch (err) {
      setFeedback(`${verb} failed: ${_friendlyError(err)}`);
    } finally {
      setPendingId(null);
    }
  }

  const reports = queryResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Moderation queue
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Open reports, oldest first. Actioning or dismissing a report
          updates its status and writes an <code>admin_log</code> entry.
          Take the corrective action (ban, hide, etc.) separately on the
          matching admin page.
        </p>
      </div>

      {feedback && (
        <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-fg-strong">
          {feedback}
        </div>
      )}

      {queryResult.isLoading ? (
        <div className="text-sm text-fg-muted">Loading…</div>
      ) : queryResult.isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load reports: {_friendlyError(queryResult.error)}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-fg-muted">
          Queue is empty — no open reports.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Report id" value={r.id} mono />
                <Field
                  label="Filed"
                  value={
                    r.createdAt ? r.createdAt.toLocaleString() : "—"
                  }
                />
                <Field label="Reporter uid" value={r.reporter || "—"} mono />
                <Field
                  label="Target"
                  value={`${r.targetType}: ${r.targetId || "—"}`}
                  mono
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-fg-muted">
                  Reason
                </div>
                <div className="text-sm text-fg-strong whitespace-pre-wrap">
                  {r.reason || "—"}
                </div>
              </div>
              {r.evidence && r.evidence.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-fg-muted">
                    Evidence
                  </div>
                  <ul className="mt-1 text-sm text-fg-strong">
                    {r.evidence.map((url, i) => (
                      <li key={i} className="break-all">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-dotted hover:text-primary"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="block text-xs uppercase tracking-wide text-fg-muted">
                  Decision note (optional)
                </label>
                <input
                  type="text"
                  value={notesById[r.id] ?? ""}
                  onChange={(e) =>
                    setNotesById((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  placeholder="e.g. spam, duplicate, banned the reported user"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary"
                  autoComplete="off"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => decide(r.id, "action")}
                    disabled={pendingId !== null}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Working…" : "Mark actioned"}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(r.id, "dismiss")}
                    disabled={pendingId !== null}
                    className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-fg-strong transition-opacity disabled:opacity-50"
                  >
                    {pendingId === r.id ? "Working…" : "Dismiss"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reports.length === QUEUE_LIMIT && (
        <div className="text-xs text-fg-muted">
          Showing first {QUEUE_LIMIT} open reports. Decide some to surface
          the rest.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-fg-muted">
        {label}
      </div>
      <div
        className={`text-sm text-fg-strong ${mono ? "font-mono break-all" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function _friendlyError(err: unknown): string {
  if (err instanceof FunctionsError) return `${err.code}: ${err.message}`;
  if (err instanceof FirebaseError) return `${err.code}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
