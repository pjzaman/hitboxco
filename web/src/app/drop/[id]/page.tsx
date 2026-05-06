import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerDb } from "@/lib/firebase/server";
import { PublicHeader, PublicFooter } from "@/components/public/chrome";
import { YouTubeEmbed } from "@/components/public/youtube-embed";
import { getCollectible } from "@/lib/services";
import { formatDate } from "@/lib/types";

/**
 * /drop/[id] — public SEO page for a single collectible (Layer 4).
 *
 * Server-rendered against `collectibles/{id}`. Sets per-page metadata +
 * JSON-LD `Product` / `Offer` structured data so Google Shopping,
 * Twitter, Discord, iMessage all render rich previews when the URL is
 * shared.
 */

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const drop = await getCollectible(getServerDb(), id);
  if (!drop) {
    return {
      title: "Drop not found · Hitbox",
      description: "This drop isn't on Hitbox.",
    };
  }
  const name = drop.name ?? "Drop";
  const artistName = drop.artistName ?? "an artist";
  const title = `${name} by ${artistName} · Hitbox`;
  const priceText =
    drop.price != null ? ` · ${drop.currency ?? "USD"} ${drop.price}` : "";
  const description = drop.description
    ? drop.description.slice(0, 200)
    : `Limited drop from ${artistName}${priceText} on Hitbox.`;
  return {
    title,
    description,
    alternates: { canonical: `/drop/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: drop.imageUrl ? [{ url: drop.imageUrl }] : undefined,
    },
    twitter: {
      card: drop.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: drop.imageUrl ? [drop.imageUrl] : undefined,
    },
  };
}

export default async function DropPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const drop = await getCollectible(getServerDb(), id);
  if (!drop) notFound();

  const remaining =
    drop.availableForPurchase ??
    (drop.totalSupply != null && drop.minted != null
      ? Math.max(0, drop.totalSupply - drop.minted)
      : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: drop.name,
    description: drop.description,
    image: drop.imageUrl,
    brand: drop.artistName ? { "@type": "Brand", name: drop.artistName } : undefined,
    offers:
      drop.price != null
        ? {
            "@type": "Offer",
            priceCurrency: drop.currency ?? "USD",
            price: drop.price,
            availability:
              drop.isActive === false || (remaining != null && remaining <= 0)
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
            url: `/drop/${id}`,
          }
        : undefined,
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
        <div className="space-y-4">
          {drop.videoUrl && (
            <YouTubeEmbed videoUrl={drop.videoUrl} title={drop.name ?? "Drop"} />
          )}
          <div className="aspect-square rounded-3xl overflow-hidden bg-surface-2 border border-white/5">
            {drop.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={drop.imageUrl}
                alt={drop.name ?? "Drop"}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        </div>
        <div className="space-y-5">
          {drop.artistName && drop.artistId ? (
            <Link
              href={`/artist/${drop.artistId}`}
              className="text-sm text-fg-muted hover:text-primary transition-colors"
            >
              {drop.artistName} →
            </Link>
          ) : drop.artistName ? (
            <div className="text-sm text-fg-muted">{drop.artistName}</div>
          ) : null}

          <h1 className="text-3xl md:text-4xl font-bold text-fg-strong tracking-tight">
            {drop.name ?? "Untitled drop"}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {drop.rarity && (
              <span className="text-xs uppercase tracking-wider text-fg-muted">
                {drop.rarity}
              </span>
            )}
            {drop.category && (
              <span className="text-xs uppercase tracking-wider text-fg-muted">
                · {drop.category}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3 pt-2 border-t border-white/5">
            <div className="text-3xl font-bold gradient-text">
              {drop.price != null
                ? `${drop.currency ?? "USD"} ${drop.price}`
                : "Trade only"}
            </div>
            {remaining != null && (
              <div className="text-sm text-fg-muted">
                {remaining} left of {drop.totalSupply ?? "?"}
              </div>
            )}
          </div>

          {drop.description && (
            <p className="text-fg-muted whitespace-pre-wrap leading-relaxed">
              {drop.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/drop/${id}`)}`}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
            >
              Sign in to claim
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-white/15 bg-black/30 px-5 py-2.5 text-sm font-medium text-fg-strong"
            >
              Create an account
            </Link>
          </div>

          <dl className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 text-sm">
            {drop.releaseDate && (
              <DetailLine label="Released" value={formatDate(drop.releaseDate)} />
            )}
            {drop.endDate && (
              <DetailLine label="Ends" value={formatDate(drop.endDate)} />
            )}
          </dl>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="text-fg-strong">{value}</dd>
    </div>
  );
}
