"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Sparkles, Megaphone, Tag, Newspaper } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/public/youtube-embed";
import { EngagementBar } from "@/components/feed/engagement-bar";

/**
 * Consumer feed (Layer 1).
 *
 * Reads `feed_events` ordered by `publishAt` desc, filtered to
 * `status == 'published'`. Audience filtering for v1 is client-side;
 * once user follows are wired we'll do an inbox fanout server-side.
 *
 * Each entry renders one of: post, banner, drop_release, announcement.
 */

const PAGE_SIZE = 12;

type FeedEventType = "post" | "banner" | "drop_release" | "announcement";

interface FeedEvent {
  id: string;
  type: FeedEventType;
  audience: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  collectibleId: string | null;
  publishAt: Date | null;
  expiresAt: Date | null;
}

interface PageResult {
  events: FeedEvent[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
}

function _toEvent(snap: QueryDocumentSnapshot<DocumentData>): FeedEvent {
  const d = snap.data();
  const publish = d.publishAt;
  const expires = d.expiresAt;
  return {
    id: snap.id,
    type:
      d.type === "post" ||
      d.type === "banner" ||
      d.type === "drop_release" ||
      d.type === "announcement"
        ? d.type
        : "post",
    audience: typeof d.audience === "string" ? d.audience : "all",
    authorId: typeof d.authorId === "string" ? d.authorId : "",
    authorName: typeof d.authorName === "string" ? d.authorName : "Hitbox",
    authorAvatarUrl:
      typeof d.authorAvatarUrl === "string" ? d.authorAvatarUrl : null,
    title: typeof d.title === "string" ? d.title : null,
    body: typeof d.body === "string" ? d.body : null,
    imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : null,
    videoUrl: typeof d.videoUrl === "string" ? d.videoUrl : null,
    ctaLabel: typeof d.ctaLabel === "string" ? d.ctaLabel : null,
    ctaUrl: typeof d.ctaUrl === "string" ? d.ctaUrl : null,
    collectibleId:
      typeof d.collectibleId === "string" ? d.collectibleId : null,
    publishAt: publish instanceof Timestamp ? publish.toDate() : null,
    expiresAt: expires instanceof Timestamp ? expires.toDate() : null,
  };
}

async function _fetchPage(
  cursor: QueryDocumentSnapshot<DocumentData> | undefined,
): Promise<PageResult> {
  const base = collection(db, "feed_events");
  const q = cursor
    ? query(
        base,
        where("status", "==", "published"),
        orderBy("publishAt", "desc"),
        startAfter(cursor),
        limit(PAGE_SIZE),
      )
    : query(
        base,
        where("status", "==", "published"),
        orderBy("publishAt", "desc"),
        limit(PAGE_SIZE),
      );
  const snap = await getDocs(q);
  const events = snap.docs.map(_toEvent);
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { events, cursor: last };
}

export default function FeedPage() {
  const { user } = useAuth();

  // Load the user's followed-artist set once. Used to filter
  // `audience: 'followers'` entries — those only show up if you follow
  // the authoring artist. Cheap one-shot read; mutations through the
  // artist Follow button update this state directly.
  const [followingIds, setFollowingIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          collection(db, "users", user.uid, "following"),
        );
        if (cancelled) return;
        setFollowingIds(new Set(snap.docs.map((d) => d.id)));
      } catch {
        if (!cancelled) setFollowingIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const queryResult = useInfiniteQuery<PageResult>({
    queryKey: ["consumer", "feed_events"],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      _fetchPage(
        pageParam as QueryDocumentSnapshot<DocumentData> | undefined,
      ),
    getNextPageParam: (last) =>
      last.events.length < PAGE_SIZE ? undefined : last.cursor ?? undefined,
  });

  const now = useMemo(() => Date.now(), []);
  const events: FeedEvent[] = useMemo(() => {
    const all = queryResult.data?.pages.flatMap((p) => p.events) ?? [];
    return all.filter((e) => {
      if (e.expiresAt && e.expiresAt.getTime() <= now) return false;
      // Audience-targeted filtering. `audience='followers'` entries are
      // only shown to users who follow the authoring artist. Until the
      // follow set has loaded we default to hiding them so a momentarily-
      // empty set doesn't flash a wave of irrelevant content.
      if (e.audience === "followers") {
        if (!followingIds) return false;
        if (!e.authorId || !followingIds.has(e.authorId)) return false;
      }
      return true;
    });
  }, [queryResult.data, now, followingIds]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-fg-strong tracking-tight">
          Feed
        </h1>
        <p className="mt-2 text-fg-muted">
          Updates from artists, drops, and the wider Hitbox ecosystem.
        </p>
      </div>

      {queryResult.isLoading && (
        <GlassCard className="text-center py-10">
          <div className="text-fg-muted text-sm">Loading…</div>
        </GlassCard>
      )}

      {queryResult.isError && (
        <GlassCard>
          <p className="text-tertiary text-sm font-medium mb-2">
            Failed to load feed
          </p>
          <p className="text-xs text-fg-muted font-mono break-all">
            {String(queryResult.error)}
          </p>
        </GlassCard>
      )}

      {!queryResult.isLoading && events.length === 0 && (
        <GlassCard className="text-center py-20 ambient-backdrop relative overflow-hidden">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-fg-strong mb-3">
            Quiet on the feed
          </h3>
          <p className="text-fg-muted max-w-md mx-auto">
            Once artists post drops, banners, or announcements, they&apos;ll
            show up here.
          </p>
        </GlassCard>
      )}

      <div className="space-y-5">
        {events.map((e) => (
          <FeedEntry key={e.id} event={e} />
        ))}
      </div>

      {queryResult.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="md"
            shape="pill"
            onClick={() => queryResult.fetchNextPage()}
            disabled={queryResult.isFetchingNextPage}
          >
            {queryResult.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedEntry({ event }: { event: FeedEvent }) {
  switch (event.type) {
    case "banner":
      return <BannerCard event={event} />;
    case "drop_release":
      return <DropReleaseCard event={event} />;
    case "announcement":
      return <AnnouncementCard event={event} />;
    case "post":
    default:
      return <PostCard event={event} />;
  }
}

function PostCard({ event }: { event: FeedEvent }) {
  return (
    <GlassCard>
      <Header event={event} icon={<Newspaper className="h-4 w-4" />} />
      {event.title && (
        <h3 className="mt-3 text-xl font-semibold text-fg-strong">
          {event.title}
        </h3>
      )}
      {event.body && (
        <p className="mt-2 text-fg-muted whitespace-pre-wrap">{event.body}</p>
      )}
      {event.videoUrl ? (
        <div className="mt-4">
          <YouTubeEmbed
            videoUrl={event.videoUrl}
            title={event.title ?? "Video"}
          />
        </div>
      ) : event.imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl}
            alt={event.title ?? "Post image"}
            className="w-full h-auto object-cover"
          />
        </div>
      ) : null}
      <CtaRow event={event} />
      <EngagementBar eventId={event.id} />
    </GlassCard>
  );
}

function BannerCard({ event }: { event: FeedEvent }) {
  return (
    <GlassCard className="relative overflow-hidden p-0">
      {event.videoUrl ? (
        <YouTubeEmbed
          videoUrl={event.videoUrl}
          title={event.title ?? "Banner"}
          className="!rounded-none border-0"
        />
      ) : event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={event.title ?? "Banner"}
          className="w-full max-h-80 object-cover"
        />
      ) : (
        <div className="ambient-backdrop h-48" />
      )}
      <div className="p-6 space-y-3">
        <Header event={event} icon={<Megaphone className="h-4 w-4" />} />
        {event.title && (
          <h2 className="text-2xl md:text-3xl font-bold gradient-text">
            {event.title}
          </h2>
        )}
        {event.body && <p className="text-fg-muted">{event.body}</p>}
        <CtaRow event={event} />
        <EngagementBar eventId={event.id} />
      </div>
    </GlassCard>
  );
}

function DropReleaseCard({ event }: { event: FeedEvent }) {
  const fallbackHref = event.collectibleId
    ? `/drop/${event.collectibleId}`
    : "/marketplace";
  return (
    <GlassCard>
      <Header event={event} icon={<Tag className="h-4 w-4" />} />
      {event.videoUrl && (
        <div className="mt-3">
          <YouTubeEmbed
            videoUrl={event.videoUrl}
            title={event.title ?? "Drop video"}
          />
        </div>
      )}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5 items-start">
        {event.imageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={event.title ?? "Drop"}
              className="w-full h-full object-cover aspect-square"
            />
          </div>
        ) : (
          <div className="aspect-square rounded-2xl bg-surface-2" />
        )}
        <div className="space-y-3">
          {event.title && (
            <h3 className="text-2xl font-semibold text-fg-strong">
              {event.title}
            </h3>
          )}
          {event.body && (
            <p className="text-fg-muted whitespace-pre-wrap">{event.body}</p>
          )}
          <div className="pt-1">
            <Link href={event.ctaUrl ?? fallbackHref}>
              <Button variant="primary" size="md" shape="pill">
                {event.ctaLabel ?? "View drop"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <EngagementBar eventId={event.id} />
    </GlassCard>
  );
}

function AnnouncementCard({ event }: { event: FeedEvent }) {
  return (
    <GlassCard className="border-tertiary/20">
      <Header event={event} icon={<Sparkles className="h-4 w-4" />} />
      {event.title && (
        <h3 className="mt-3 text-lg font-semibold text-fg-strong">
          {event.title}
        </h3>
      )}
      {event.body && (
        <p className="mt-2 text-fg-muted whitespace-pre-wrap">{event.body}</p>
      )}
      <CtaRow event={event} />
      <EngagementBar eventId={event.id} />
    </GlassCard>
  );
}

function Header({
  event,
  icon,
}: {
  event: FeedEvent;
  icon: React.ReactNode;
}) {
  const ts = event.publishAt ? _relativeTime(event.publishAt) : "";
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-primary">
        {event.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.authorAvatarUrl}
            alt={event.authorName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-fg-strong font-medium truncate">
          {event.authorName}
        </div>
        <div className="text-xs text-fg-muted">{ts}</div>
      </div>
    </div>
  );
}

function CtaRow({ event }: { event: FeedEvent }) {
  if (!event.ctaUrl) return null;
  const isExternal = /^https?:\/\//i.test(event.ctaUrl);
  const label = event.ctaLabel ?? "Open";
  return (
    <div className="mt-4">
      {isExternal ? (
        <a href={event.ctaUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="md" shape="pill">
            {label}
          </Button>
        </a>
      ) : (
        <Link href={event.ctaUrl}>
          <Button variant="secondary" size="md" shape="pill">
            {label}
          </Button>
        </Link>
      )}
    </div>
  );
}

function _relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
