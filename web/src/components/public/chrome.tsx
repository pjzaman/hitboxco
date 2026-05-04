import Link from "next/link";

/**
 * Shared header/footer for unauthenticated public pages
 * (`/artist/[id]`, `/drop/[id]`, `/season/[id]`).
 */

export function PublicHeader() {
  return (
    <header className="border-b border-white/5 bg-black/30 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-secondary to-tertiary glow-primary" />
          <span className="font-bold tracking-tight text-fg-strong">Hitbox</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="text-fg-muted hover:text-fg-strong transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-black/20">
      <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-fg-muted">
        © {new Date().getFullYear()} Hitbox · Physical-digital collectibles
        with verified provenance.
      </div>
    </footer>
  );
}
