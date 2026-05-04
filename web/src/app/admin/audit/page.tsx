"use client";

import { useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/client";

/**
 * /admin/audit — Section 15.6.
 *
 * Read-only browser for the `admin_log` collection. Every privileged
 * admin action (setAdmin / revokeAdmin / refundPurchase / banUser, plus
 * any future ones) writes one append-only entry here. Firestore rules
 * allow admins to read the collection and deny all client writes.
 *
 * Strategy:
 *   • Server-side query: order by timestamp desc, page of `PAGE_SIZE`,
 *     cursor via `startAfter`. No `where` clauses needed for the v1
 *     view — we keep server queries simple and apply action / actor
 *     filters client-side over the loaded pages. As `admin_log` grows
 *     past a few thousand entries, swap in composite indexes for
 *     (action, timestamp) and (actorUid, timestamp).
 *   • The `before` / `after` snapshots and full `args` are hidden by
 *     default; click an entry to expand.
 */

const PAGE_SIZE = 25;
const KNOWN_ACTIONS = [
  "setAdmin",
  "revokeAdmin",
  "refundPurchase",
  "banUser",
];

interface AdminLogEntry {
  id: string;
  actorUid: string;
  action: string;
  targetIds: string[];
  args: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string | null;
  timestamp: Date | null;
}

interface PageResult {
  entries: AdminLogEntry[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}

function _toEntry(snap: QueryDocumentSnapshot<DocumentData>): AdminLogEntry {
  const d = snap.data();
  const ts = d.timestamp;
  return {
    id: snap.id,
    actorUid: typeof d.actorUid === "string" ? d.actorUid : "",
    action: typeof d.action === "string" ? d.action : "",
    targetIds: Array.isArray(d.targetIds) ? d.targetIds.map(String) : [],
    args:
      d.args && typeof d.args === "object" && !Array.isArray(d.args)
        ? (d.args as Record<string, unknown>)
        : null,
    result:
      d.result && typeof d.result === "object" && !Array.isArray(d.result)
        ? (d.result as Record<string, unknown>)
        : null,
    before:
      d.before && typeof d.before === "object" && !Array.isArray(d.before)
        ? (d.before as Record<string, unknown>)
        : null,
    after:
      d.after && typeof d.after === "object" && !Array.isArray(d.after)
        ? (d.after as Record<string, unknown>)
        : null,
    note: typeof d.note === "string" ? d.note : null,
    timestamp:
      ts instanceof Timestamp ? ts.toDate() : ts instanceof Date ? ts : null,
  };
}

async function _fetchPage(
  cursor: QueryDocumentSnapshot<DocumentData> | undefined,
): Promise<PageResult> {
  const baseQuery = cursor
    ? query(
        collection(db, "admin_log"),
        orderBy("timestamp", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE),
      )
    : query(
        collection(db, "admin_log"),
        orderBy("timestamp", "desc"),
        limit(PAGE_SIZE),
      );
  const snap = await getDocs(baseQuery);
  const entries = snap.docs.map(_toEntry);
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { entries, cursor: last };
}

export default function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const queryResult = useInfiniteQuery<PageResult>({
    queryKey: ["admin_log"],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      _fetchPage(
        pageParam as QueryDocumentSnapshot<DocumentData> | undefined,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.entries.length < PAGE_SIZE ? undefined : lastPage.cursor ?? undefined,
  });

  const allEntries: AdminLogEntry[] = useMemo(
    () => queryResult.data?.pages.flatMap((p) => p.entries) ?? [],
    [queryResult.data],
  );

  const filtered = useMemo(() => {
    const trimmedActor = actorFilter.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (trimmedActor && !e.actorUid.toLowerCase().includes(trimmedActor)) {
        return false;
      }
      return true;
    });
  }, [allEntries, actionFilter, actorFilter]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Append-only record of every privileged admin action. Filters apply
          to loaded pages only — load more to extend the search window.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-fg-muted">
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong focus:outline-none focus:border-primary"
          >
            <option value="all">All</option>
            {KNOWN_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[14rem]">
          <label className="text-xs uppercase tracking-wide text-fg-muted">
            Actor uid contains
          </label>
          <input
            type="text"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="(any)"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary"
            autoComplete="off"
          />
        </div>
      </div>

      {queryResult.isLoading ? (
        <div className="text-sm text-fg-muted">Loading…</div>
      ) : queryResult.isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load audit entries: {String(queryResult.error)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-fg-muted">
          No audit entries match the current filters.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((entry) => (
            <AuditEntryRow
              key={entry.id}
              entry={entry}
              expanded={expanded.has(entry.id)}
              onToggle={() => toggleExpanded(entry.id)}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-fg-muted">
          Showing {filtered.length} of {allEntries.length} loaded entries.
        </div>
        {queryResult.hasNextPage && (
          <button
            type="button"
            onClick={() => queryResult.fetchNextPage()}
            disabled={queryResult.isFetchingNextPage}
            className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-fg-strong transition-opacity disabled:opacity-50"
          >
            {queryResult.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

function AuditEntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AdminLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ts = entry.timestamp ? entry.timestamp.toLocaleString() : "—";
  return (
    <li className="rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-3 hover:bg-black/30 transition-colors"
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-sm text-fg-strong">{entry.action}</span>
          <span className="text-xs text-fg-muted">by</span>
          <span className="font-mono text-xs text-fg-strong break-all">
            {entry.actorUid || "—"}
          </span>
          {entry.targetIds.length > 0 && (
            <>
              <span className="text-xs text-fg-muted">→</span>
              <span className="font-mono text-xs text-fg-strong break-all">
                {entry.targetIds.join(", ")}
              </span>
            </>
          )}
          <span className="ml-auto text-xs text-fg-muted">{ts}</span>
        </div>
        {entry.note && (
          <div className="mt-1 text-xs text-fg-muted">note: {entry.note}</div>
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailBlock title="args" value={entry.args} />
          <DetailBlock title="result" value={entry.result} />
          <DetailBlock title="before" value={entry.before} />
          <DetailBlock title="after" value={entry.after} />
        </div>
      )}
    </li>
  );
}

function DetailBlock({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">
        {title}
      </div>
      <pre className="mt-1 text-xs text-fg-strong font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
