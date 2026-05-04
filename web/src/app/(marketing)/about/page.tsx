import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Hitbox",
  description:
    "Hitbox is a physical-digital collectibles platform — NFC-verified items with on-chain provenance, evolving over their trade history.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Hitbox",
    description:
      "Hitbox is a physical-digital collectibles platform — NFC-verified items with on-chain provenance.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-wider text-fg-muted mb-3">
          About
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-fg-strong tracking-tight">
          Collecting <span className="gradient-text">verified</span>.
        </h1>
        <p className="mt-5 text-lg text-fg-muted leading-relaxed">
          Hitbox makes collectibles you can hold and trade. An NFC chip
          embedded in every drop ties the physical item to a verifiable
          digital record — provenance you don&apos;t have to take on
          faith, and evolution that rewards the items collectors actually
          care about.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-strong">
          What makes a Hitbox drop different
        </h2>
        <ul className="space-y-3 text-fg-muted leading-relaxed">
          <li>
            <strong className="text-fg-strong">Verified.</strong> Every
            scan against the Hitbox app calls a server-side challenge that
            confirms the chip is the real one — clones don&apos;t pass.
          </li>
          <li>
            <strong className="text-fg-strong">Evolving.</strong> Trade
            history is recorded server-side and can mutate the item&apos;s
            visual or metadata state under rules the artist publishes.
          </li>
          <li>
            <strong className="text-fg-strong">Yours.</strong> Ownership
            transfers happen through atomic Cloud Functions with full
            provenance — no manual sheet, no opaque backend.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-strong">For artists</h2>
        <p className="text-fg-muted leading-relaxed">
          Hitbox handles the chip authentication, the marketplace, the
          ledger, and the payouts. You bring the drops. Reach out at{" "}
          <a
            href="mailto:hello@hitbox.app"
            className="underline decoration-dotted hover:text-primary"
          >
            hello@hitbox.app
          </a>
          {" "}to talk about a season.
        </p>
      </section>

      <section className="pt-8 border-t border-white/10 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          Create an account
        </Link>
        <Link
          href="/marketplace"
          className="rounded-full border border-white/15 bg-black/30 px-5 py-2.5 text-sm font-medium text-fg-strong"
        >
          Browse marketplace
        </Link>
      </section>
    </div>
  );
}
