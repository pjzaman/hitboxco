"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getCountFromServer,
  query,
  orderBy,
  limit,
  addDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Heart, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";

/**
 * EngagementBar (Layer 3 — feed reactions + comments).
 *
 * Sits at the bottom of every consumer feed card. Shows a like toggle
 * + count, and a comment toggle that expands an inline thread with a
 * composer.
 *
 * Counts are one-shot via `getCountFromServer` so the bar doesn't open
 * a realtime listener per card (saves Firestore read budget on long
 * feeds). Toggles update the cached count optimistically.
 *
 * Comments thread loads on first expand (lazy), no pagination in v1 —
 * if a thread gets long we'll add a "load earlier" button later.
 */

const COMMENT_PAGE = 25;

interface CommentRow {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  createdAt: Date | null;
}

export function EngagementBar({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [likePending, setLikePending] = useState(false);

  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Initial fetch: reaction count + has-liked + comment count.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reactionsRef = collection(db, "feed_events", eventId, "reactions");
        const commentsRef = collection(db, "feed_events", eventId, "comments");
        const [rCount, cCount, mineSnap] = await Promise.all([
          getCountFromServer(reactionsRef),
          getCountFromServer(commentsRef),
          uid
            ? getDoc(doc(db, "feed_events", eventId, "reactions", uid))
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setLikeCount(rCount.data().count);
        setCommentCount(cCount.data().count);
        setHasLiked(!!mineSnap?.exists());
      } catch (err) {
        console.warn("EngagementBar count fetch failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, uid]);

  async function toggleLike() {
    if (!uid || likePending) return;
    setLikePending(true);
    const likedNow = !hasLiked;
    // Optimistic update.
    setHasLiked(likedNow);
    setLikeCount((c) => (c == null ? c : c + (likedNow ? 1 : -1)));
    try {
      const ref = doc(db, "feed_events", eventId, "reactions", uid);
      if (likedNow) {
        await setDoc(ref, {
          uid,
          type: "like",
          createdAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(ref);
      }
    } catch (err) {
      // Roll back on failure.
      console.warn("toggle like failed", err);
      setHasLiked(!likedNow);
      setLikeCount((c) => (c == null ? c : c + (likedNow ? -1 : 1)));
    } finally {
      setLikePending(false);
    }
  }

  return (
    <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!uid || likePending}
          aria-pressed={hasLiked}
          className={
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors disabled:opacity-50 " +
            (hasLiked
              ? "bg-rose-500/15 text-rose-300"
              : "bg-black/30 text-fg-muted hover:text-fg-strong")
          }
          title={uid ? undefined : "Sign in to like"}
        >
          <Heart
            className={`h-4 w-4 ${hasLiked ? "fill-rose-300" : ""}`}
          />
          <span>{likeCount ?? "—"}</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-black/30 text-fg-muted hover:text-fg-strong transition-colors"
          aria-expanded={commentsOpen}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount ?? "—"}</span>
        </button>
      </div>

      {commentsOpen && (
        <CommentThread
          eventId={eventId}
          onCommentAdded={() =>
            setCommentCount((c) => (c == null ? c : c + 1))
          }
          onCommentRemoved={() =>
            setCommentCount((c) => (c == null ? c : Math.max(0, c - 1)))
          }
        />
      )}
    </div>
  );
}

function CommentThread({
  eventId,
  onCommentAdded,
  onCommentRemoved,
}: {
  eventId: string;
  onCommentAdded: () => void;
  onCommentRemoved: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "feed_events", eventId, "comments"),
            orderBy("createdAt", "asc"),
            limit(COMMENT_PAGE),
          ),
        );
        if (cancelled) return;
        setComments(
          snap.docs.map((d) => {
            const data = d.data();
            const ts = data.createdAt;
            return {
              id: d.id,
              authorUid:
                typeof data.authorUid === "string" ? data.authorUid : "",
              authorName:
                typeof data.authorName === "string"
                  ? data.authorName
                  : "Anonymous",
              authorAvatarUrl:
                typeof data.authorAvatarUrl === "string"
                  ? data.authorAvatarUrl
                  : null,
              text: typeof data.text === "string" ? data.text : "",
              createdAt: ts instanceof Timestamp ? ts.toDate() : null,
            };
          }),
        );
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || posting) return;
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      const ref = collection(db, "feed_events", eventId, "comments");
      const created = await addDoc(ref, {
        authorUid: user.uid,
        authorName: user.displayName || user.email || "Member",
        authorAvatarUrl: user.photoURL ?? null,
        text,
        createdAt: serverTimestamp(),
      });
      // Optimistically append (real timestamp arrives on next fetch).
      setComments((prev) =>
        (prev ?? []).concat({
          id: created.id,
          authorUid: user.uid,
          authorName: user.displayName || user.email || "Member",
          authorAvatarUrl: user.photoURL ?? null,
          text,
          createdAt: new Date(),
        }),
      );
      setDraft("");
      onCommentAdded();
    } catch (err) {
      setError(String(err));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(c: CommentRow) {
    if (!user || c.authorUid !== user.uid) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "feed_events", eventId, "comments", c.id));
      setComments((prev) => (prev ?? []).filter((x) => x.id !== c.id));
      onCommentRemoved();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      {comments == null ? (
        <div className="text-xs text-fg-muted">Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-fg-muted">
          No comments yet. Be the first.
        </div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl bg-black/20 border border-white/5 px-3 py-2 text-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-fg-strong">
                  {c.authorName}
                </span>
                <span className="text-[10px] text-fg-muted">
                  {c.createdAt ? c.createdAt.toLocaleString() : ""}
                </span>
              </div>
              <div className="mt-1 text-fg-muted whitespace-pre-wrap">
                {c.text}
              </div>
              {user && c.authorUid === user.uid && (
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  className="mt-1 text-[11px] text-fg-muted hover:text-rose-300"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handlePost} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-fg-strong placeholder:text-fg-muted focus:outline-none focus:border-primary"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!draft.trim() || posting}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {posting ? "…" : "Post"}
          </button>
        </form>
      ) : (
        <div className="text-xs text-fg-muted">Sign in to comment.</div>
      )}
    </div>
  );
}
