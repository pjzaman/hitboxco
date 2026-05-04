import { notFound } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore/lite";
import type { Metadata } from "next";
import { getServerDb } from "@/lib/firebase/server";
import { PublicHeader, PublicFooter } from "@/components/public/chrome";

/**
 * /season/[id] — public SEO page for a Hitbox season (Layer 4).
 *
 * Reads `seasons/{id}` server-side. Shorter and simpler than the
 * artist or drop pages — primarily a landing surface for season-named
 * marketing campaigns.
 */

interface SeasonDoc {
  name?: string;
  slug?: string | null;
  description?: string;
  coverImageUrl?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

interface ResolvedSeason extends SeasonDoc {
  id: string;
}

/**
 * Resolve a season by its doc id OR `slug` field. Same pattern as the
 * artist page — id lookup first, slug query fallback.
 */
async function _loadSeason(idOrSlug: string): Promise<ResolvedSeason | null> {
  try {
    const db = getServerDb();
    const direct = await getDoc(doc(db, "seasons", idOrSlug));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as SeasonDoc) };
    }
    const bySlug = await getDocs(
      query(
        collection(db, "seasons"),
        where("slug", "==", idOrSlug),
        limit(1),
      ),
    );
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return { id: d.id, ...(d.data() as SeasonDoc) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const season = await _loadSeason(id);
  if (!season) {
    return {
      title: "Season not found · Hitbox",
      description: "This season isn't on Hitbox.",
    };
  }
  const title = `${season.name ?? "Season"} · Hitbox`;
  const description = season.description
    ? season.description.slice(0, 200)
    : `${season.name ?? "Season"} on Hitbox.`;
  const canonical = `/season/${season.slug || season.id}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      images: season.coverImageUrl
        ? [{ url: season.coverImageUrl }]
        : undefined,
    },
    twitter: {
      card: season.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: season.coverImageUrl ? [season.coverImageUrl] : undefined,
    },
  };
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idOrSlug } = await params;
  const season = await _loadSeason(idOrSlug);
  if (!season) notFound();
  // Canonical URL uses slug if set, else doc id.
  const canonicalRef = season.slug || season.id;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <PublicHeader />
      <div className="relative h-56 md:h-80 lg:h-96 w-full overflow-hidden bg-surface-2">
        {season.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={season.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="ambient-backdrop w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>
      <main className="max-w-3xl mx-auto px-6 -mt-20 relative space-y-8 pb-20">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-fg-muted">
            Season
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text tracking-tight">
            {season.name ?? "Season"}
          </h1>
          {(season.startDate || season.endDate) && (
            <div className="text-sm text-fg-muted">
              {season.startDate} {season.endDate ? `– ${season.endDate}` : null}
            </div>
          )}
        </div>
        {season.description && (
          <p className="text-fg-muted text-lg leading-relaxed">
            {season.description}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-3">
          <Link
            href={`/login?next=${encodeURIComponent(`/season/${canonicalRef}`)}`}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/marketplace"
            className="rounded-full border border-white/15 bg-black/30 px-5 py-2.5 text-sm font-medium text-fg-strong"
          >
            Browse marketplace
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
