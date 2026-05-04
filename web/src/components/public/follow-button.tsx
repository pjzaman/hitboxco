"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

/**
 * FollowButton — Layer 3 follower fanout.
 *
 * Toggles a `users/{auth.uid}/following/{artistId}` doc. The presence of
 * the doc is the follow signal — the consumer feed reads the user's
 * following set on mount and uses it to filter `audience: 'followers'`
 * entries.
 *
 * If the visitor isn't signed in, the button becomes a "Sign in to
 * follow" link that brings them back via `?next=`.
 */
export function FollowButton({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) {
      setFollowing(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", user.uid, "following", artistId),
        );
        if (!cancelled) setFollowing(snap.exists());
      } catch {
        if (!cancelled) setFollowing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, artistId]);

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/artist/${artistId}`)}`}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        Sign in to follow
      </Link>
    );
  }

  async function toggle() {
    if (!user || following === null || pending) return;
    setPending(true);
    const next = !following;
    setFollowing(next); // optimistic
    try {
      const ref = doc(db, "users", user.uid, "following", artistId);
      if (next) {
        await setDoc(ref, {
          artistId,
          artistName,
          createdAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(ref);
      }
    } catch (err) {
      console.warn("follow toggle failed", err);
      setFollowing(!next); // roll back
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || following === null}
      aria-pressed={!!following}
      className={
        "rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 " +
        (following
          ? "bg-white/10 text-fg-strong hover:bg-white/15"
          : "bg-primary text-white")
      }
    >
      {following === null ? "…" : following ? "Following" : "Follow"}
    </button>
  );
}
