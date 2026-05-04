import { notFound } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore/lite";
import type { Metadata } from "next";
import { getServerDb } from "@/lib/firebase/server";
import { PublicHeader, PublicFooter } from "@/components/public/chrome";
import { FollowButton } from "@/components/public/follow-button";

/**
 * /artist/[id] — public SEO page (Layer 4).
 *
 * Server-rendered with Firestore Lite reads against `artists/{id}` and
 * the artist's active collectibles. Sets per-page metadata (title,
 * description, Open Graph, Twitter card) and JSON-LD MusicGroup
 * structured data so search engines and link previewers render it well.
 *
 * Public rules required: `artists` and `collectibles` allow read: true.
 */

interface ArtistDoc {
  name?: string;
  slug?: string | null;
  bio?: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  isVerified?: boolean;
  websiteUrl?: string | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
}

// Resolved artist: the doc data plus the doc id, since URLs may use
// either the id or a slug and downstream code needs the canonical id.
interface ResolvedArtist extends ArtistDoc {
  id: string;
}

interface CollectibleDocData {
  name?: string;
  imageUrl?: string | null;
  rarity?: string;
  price?: number;
  currency?: string;
  releaseDate?: string;
}

type DropRow = CollectibleDocData & { id: string };

/**
 * Resolve an artist by either its Firestore doc id OR its `slug` field.
 * Doc-id lookup runs first (cheaper, single point read); slug query is
 * the fallback. Returns null if neither matches.
 */
async function _loadArtist(idOrSlug: string): Promise<ResolvedArtist | null> {
  try {
    const db = getServerDb();
    const direct = await getDoc(doc(db, "artists", idOrSlug));
    if (direct.exists()) {
      return { id: direct.id, ...(direct.data() as ArtistDoc) };
    }
    const bySlug = await getDocs(
      query(
        collection(db, "artists"),
        where("slug", "==", idOrSlug),
        limit(1),
      ),
    );
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return { id: d.id, ...(d.data() as ArtistDoc) };
    }
    return null;
  } catch {
    return null;
  }
}

async function _loadDrops(artistId: string): Promise<DropRow[]> {
  try {
    const db = getServerDb();
    const snap = await getDocs(
      query(
        collection(db, "collectibles"),
        where("artistId", "==", artistId),
        where("isActive", "==", true),
        orderBy("releaseDate", "desc"),
        limit(12),
      ),
    );
    return snap.docs.map((d) => ({
      ...(d.data() as CollectibleDocData),
      id: d.id,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const artist = await _loadArtist(id);
  if (!artist) {
    return {
      title: "Artist not found · Hitbox",
      description: "This artist isn't on Hitbox.",
    };
  }
  const title = `${artist.name ?? "Artist"} on Hitbox`;
  const description = artist.bio
    ? artist.bio.slice(0, 200)
    : `Collect ${artist.name ?? "this artist"}'s drops on Hitbox — physical-digital collectibles with verified provenance.`;
  const ogImage = artist.coverImageUrl ?? artist.profileImageUrl ?? undefined;
  // Canonical URL: prefer the slug if set, otherwise the id. Search
  // engines treat slug + id as separate URLs unless we explicitly
  // canonicalize one to the other.
  const canonical = `/artist/${artist.slug || artist.id}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idOrSlug } = await params;
  const artist = await _loadArtist(idOrSlug);
  if (!artist) notFound();
  // Drops query needs the canonical artist doc id; the URL might've
  // arrived as a slug.
  const drops = await _loadDrops(artist.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    description: artist.bio,
    image: artist.profileImageUrl,
    sameAs: [artist.websiteUrl, artist.spotifyUrl, artist.appleMusicUrl].filter(
      Boolean,
    ),
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />
      {/* Cover */}
      <div className="relative h-48 md:h-72 lg:h-96 w-full overflow-hidden bg-surface-2">
        {artist.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="ambient-backdrop w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-16 relative space-y-10 pb-20">
        <div className="flex items-end gap-5">
          <div className="h-28 w-28 md:h-32 md:w-32 rounded-3xl overflow-hidden border-2 border-bg bg-surface-2 shrink-0">
            {artist.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.profileImageUrl}
                alt={artist.name ?? "Artist"}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-fg-strong tracking-tight">
              {artist.name ?? "Unknown artist"}
              {artist.isVerified && (
                <span className="ml-2 inline-block align-middle text-primary text-sm">
                  ✓ verified
                </span>
              )}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-fg-muted">
              {artist.websiteUrl && (
                <ExternalLink href={artist.websiteUrl} label="Website" />
              )}
              {artist.spotifyUrl && (
                <ExternalLink href={artist.spotifyUrl} label="Spotify" />
              )}
              {artist.appleMusicUrl && (
                <ExternalLink href={artist.appleMusicUrl} label="Apple Music" />
              )}
            </div>
          </div>
          <div className="hidden md:inline-flex">
            <FollowButton
              artistId={artist.id}
              artistName={artist.name ?? "Artist"}
            />
          </div>
        </div>

        {artist.bio && (
          <p className="text-fg-muted text-lg leading-relaxed max-w-3xl">
            {artist.bio}
          </p>
        )}

        <section>
          <h2 className="text-xl font-semibold text-fg-strong mb-4">
            Active drops
          </h2>
          {drops.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-fg-muted">
              No active drops yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {drops.map((d) => (
                <Link
                  key={d.id}
                  href={`/drop/${d.id}`}
                  className="group block rounded-2xl border border-white/10 bg-black/20 overflow-hidden hover:bg-black/30 transition-colors"
                >
                  <div className="aspect-square bg-surface-2 overflow-hidden">
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.imageUrl}
                        alt={d.name ?? "Drop"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-fg-strong truncate">
                      {d.name ?? "Untitled"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">
                        {d.price != null
                          ? `${d.currency ?? "USD"} ${d.price}`
                          : "Trade only"}
                      </span>
                      {d.rarity && (
                        <span className="text-xs uppercase tracking-wider text-fg-muted">
                          {d.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-dotted hover:text-primary"
    >
      {label}
    </a>
  );
}
