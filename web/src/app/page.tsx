import type { Metadata } from "next";
import LandingClient from "./landing-client";

/**
 * Marketing homepage at `/` — Sequence 1/2/3 scroll-linked WebP
 * canvas animation with text beats, plus content sections (stats,
 * problem, tech stack, ecosystem, investor moats, footer).
 *
 * The page is server-rendered for the metadata + initial HTML, then
 * <LandingClient> takes over to drive the scroll animation in the
 * browser. The frame folders live at `web/public/sequence-{1,2,3}/`
 * and are served as static assets at `/sequence-N/frame_X.webp`.
 */
export const metadata: Metadata = {
  title: "Hitbox — Collectibles That Live, Evolve, and Invest in You",
  description:
    "Redesigning what collectibles are. NFC-verified, blockchain-secured smart collectibles that evolve through trade, unlock exclusive content, and hold real value.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hitbox — Collectibles That Live, Evolve, and Invest in You",
    description:
      "NFC-verified, blockchain-secured collectibles that evolve through trade, unlock exclusive content, and hold real value.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingClient />;
}
