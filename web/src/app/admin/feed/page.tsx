"use client";

import { useState } from "react";
import {
  collection,
  query,
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
  createFeedEvent,
  archiveFeedEvent,
  type FeedEventType,
  type FeedEventAudience,
  type CreateFeedEventInput,
} from "@/lib/admin/callables";

/**
 * /admin/feed — Layer 1 admin compose + manage page.
 *
 * Compose form on the left, recent feed events list on the right.
 * Submitting the form calls `createFeedEvent` which validates and
 * writes the doc through the Admin SDK + admin_log. Archive button
 * on each list row calls `archiveFeedEvent` (soft delete).
 */

const FEED_TYPES: { value: FeedEventType; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "banner", label: "Banner" },
  { value: "drop_release", label: "Drop release" },
  { value: "announcement", label: "Announcement" },
];

const RECENT_LIMIT = 25;

interface FeedEventRow {
  id: string;
  type: string;
  status: string;
  audience: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
}

function _toRow(snap: QueryDocumentSnapshot<DocumentData>): FeedEventRow {
  const d = snap.data();
  const ts = d.publishAt;
  const ex = d.expiresAt;
  return {
    id: snap.id,
    type: typeof d.type === "string" ? d.type : "—",
    status: typeof d.status === "string" ? d.status : "—",
    audience: typeof d.audience === "string" ? d.audience : "all",
    title: typeof d.title === "string" ? d.title : null,
    body: typeof d.body === "string" ? d.body : null,
    imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : null,
    publishAt: ts instanceof Timestamp ? ts.toDate() : null,
    expiresAt: ex instanceof Timestamp ? ex.toDate() : null,
    createdBy: typeof d.createdBy === "string" ? d.createdBy : "",
  };
}

export default function AdminFeedPage() {
  const [type, setType] = useState<FeedEventType>("post");
  const [audience, setAudience] = useState<FeedEventAudience>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [collectibleId, setCollectibleId] = useState("");
  const [authorName, setAuthorName] = useState("Hitbox");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const list = useQuery<FeedEventRow[]>({
    queryKey: ["admin", "feed_events", "recent"],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, "feed_events"),
          orderBy("publishAt", "desc"),
          limit(RECENT_LIMIT),
        ),
      );
      return snap.docs.map(_toRow);
    },
  });

  function resetForm() {
    setTitle("");
    setBody("");
    setImageUrl("");
    setVideoUrl("");
    setCtaLabel("");
    setCtaUrl("");
    setCollectibleId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload: CreateFeedEventInput = {
        type,
        audience,
        title: title.trim() || null,
        body: body.trim() || null,
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        collectibleId: collectibleId.trim() || null,
        authorName: authorName.trim() || null,
      };
      const result = await createFeedEvent(payload);
      setFeedback(`Published. id=${result.id}`);
      resetForm();
      await list.refetch();
    } catch (err) {
      setFeedback(`createFeedEvent failed: ${_friendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(row: FeedEventRow) {
    if (row.status === "archived") return;
    const reason = window.prompt(
      `Archive "${row.title ?? row.type}"? Optional reason:`,
      "",
    );
    if (reason === null) return; // user cancelled
    setArchivingId(row.id);
    setFeedback(null);
    try {
      await archiveFeedEvent({ feedEventId: row.id, reason: reason || undefined });
      setFeedback(`Archived ${row.id}.`);
      await list.refetch();
    } catch (err) {
      setFeedback(`archiveFeedEvent failed: ${_friendlyError(err)}`);
    } finally {
      setArchivingId(null);
    }
  }

  const titleRequired = type === "banner" || type === "drop_release";
  const collectibleRequired = type === "drop_release";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Feed
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Compose a feed entry. Posts go live immediately for the chosen
          audience and stay until you archive them or <code>expiresAt</code>
          {" "}passes.
        </p>
      </div>

      {feedback && (
        <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-fg-strong">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* compose form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4"
        >
          <FieldRow>
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FeedEventType)}
                className={selectClass}
              >
                {FEED_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as FeedEventAudience)
                }
                className={selectClass}
              >
                <option value="all">All signed-in users</option>
                <option value="followers">Followers of authorId</option>
              </select>
            </Field>
          </FieldRow>

          <Field label={`Title${titleRequired ? "" : " (optional)"}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={titleRequired}
              placeholder={
                titleRequired ? "Required for banner / drop_release" : ""
              }
              className={inputClass}
              maxLength={200}
            />
          </Field>

          <Field label="Body (optional, up to 4000 chars)">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className={`${inputClass} resize-y min-h-[6rem]`}
              maxLength={4000}
            />
          </Field>

          <Field label="Image URL (optional, https://)">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          <Field label="YouTube URL (optional — youtu.be / youtube.com / shorts)">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className={inputClass}
            />
          </Field>

          <FieldRow>
            <Field label="CTA label (optional)">
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Buy now"
                className={inputClass}
                maxLength={60}
              />
            </Field>
            <Field label="CTA URL (https:// or /path)">
              <input
                type="text"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="/drop/abc123"
                className={inputClass}
              />
            </Field>
          </FieldRow>

          {collectibleRequired && (
            <Field label="Collectible id (required for drop_release)">
              <input
                type="text"
                value={collectibleId}
                onChange={(e) => setCollectibleId(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Author display name">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={inputClass}
              maxLength={120}
            />
          </Field>

          <div className="pt-2 border-t border-white/5">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {submitting ? "Publishing…" : "Publish to feed"}
            </button>
          </div>
        </form>

        {/* recent list */}
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-fg-muted">
            Recent ({RECENT_LIMIT} most recent)
          </h2>
          {list.isLoading && (
            <div className="text-sm text-fg-muted">Loading…</div>
          )}
          {list.isError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Failed to load: {_friendlyError(list.error)}
            </div>
          )}
          {list.data && list.data.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-sm text-fg-muted">
              No feed events yet. Publish the first one on the left.
            </div>
          )}
          {list.data?.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-fg-muted">
                    {row.type}
                  </span>
                  <span
                    className={
                      row.status === "archived"
                        ? "text-xs uppercase tracking-wider text-amber-300"
                        : "text-xs uppercase tracking-wider text-emerald-300"
                    }
                  >
                    {row.status}
                  </span>
                </div>
                <span className="text-[11px] text-fg-muted">
                  {row.publishAt ? row.publishAt.toLocaleString() : "—"}
                </span>
              </div>
              <div className="mt-1 text-sm text-fg-strong font-medium">
                {row.title ?? <span className="text-fg-muted">(no title)</span>}
              </div>
              {row.body && (
                <div className="mt-1 text-xs text-fg-muted line-clamp-2 whitespace-pre-wrap">
                  {row.body}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleArchive(row)}
                  disabled={row.status === "archived" || archivingId !== null}
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-fg-strong transition-opacity disabled:opacity-40"
                >
                  {row.status === "archived"
                    ? "Archived"
                    : archivingId === row.id
                      ? "Archiving…"
                      : "Archive"}
                </button>
                <span className="font-mono text-[10px] text-fg-muted truncate">
                  {row.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary";
const selectClass = inputClass;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <label className="text-xs uppercase tracking-wide text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}

function _friendlyError(err: unknown): string {
  if (err instanceof FunctionsError) return `${err.code}: ${err.message}`;
  if (err instanceof FirebaseError) return `${err.code}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
