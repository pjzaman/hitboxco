import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight, Nfc, Sparkles, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Top bar — light, marketing-only */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-secondary to-tertiary glow-primary" />
            <span className="font-bold tracking-tight text-fg-strong">Hitbox</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">Join the waitlist</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="ambient-backdrop relative pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-widest text-fg-muted mb-8">
            <Sparkles className="h-3 w-3 text-primary" />
            Collectibles, reimagined
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-fg-strong leading-[1.05]">
            The future <span className="gradient-text">collects</span><br />different.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-fg-muted max-w-2xl mx-auto leading-relaxed">
            Verified. Evolving. Yours. NFC-embedded collectibles with on-chain
            provenance, trade-driven evolution, and an ecosystem built for collectors.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button variant="primary" size="lg">
                Join the waitlist
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Open the app
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Three-pillar feature row */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <GlassCard className="p-8">
            <Nfc className="h-8 w-8 text-primary mb-6" />
            <h3 className="text-xl font-semibold text-fg-strong mb-3">Tap. Verify. Own.</h3>
            <p className="text-fg-muted leading-relaxed">
              Every Hitbox is NFC-embedded and blockchain-verified. One tap proves authenticity, ownership, and provenance.
            </p>
          </GlassCard>

          <GlassCard className="p-8">
            <Sparkles className="h-8 w-8 text-secondary mb-6" />
            <h3 className="text-xl font-semibold text-fg-strong mb-3">They evolve.</h3>
            <p className="text-fg-muted leading-relaxed">
              Trade-driven evolution rewrites your collectibles. New visuals, rarity shifts, hidden content unlocks.
            </p>
          </GlassCard>

          <GlassCard className="p-8">
            <Users className="h-8 w-8 text-tertiary mb-6" />
            <h3 className="text-xl font-semibold text-fg-strong mb-3">Built to last.</h3>
            <p className="text-fg-muted leading-relaxed">
              An economy designed for collectors. P2P NFC trading, rarity-gated drops, and direct artist relationships.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* CTA strip */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <GlassCard className="p-12 text-center glow-primary">
            <h2 className="text-3xl md:text-5xl font-bold text-fg-strong tracking-tight">
              Step into the <span className="gradient-text">vault</span>.
            </h2>
            <p className="mt-4 text-fg-muted max-w-xl mx-auto">
              Sign up to access the marketplace, build your portfolio, and unlock the full Hitbox experience.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <footer className="border-t border-hairline px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-fg-muted">
          <span>© 2026 Hitbox. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/marketplace" className="hover:text-fg-strong">Marketplace</Link>
            <Link href="/feed" className="hover:text-fg-strong">Feed</Link>
            <Link href="/login" className="hover:text-fg-strong">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
