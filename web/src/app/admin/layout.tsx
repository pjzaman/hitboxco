"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";

/**
 * (admin) route group layout — Section 15.4.
 *
 * Gates every page under /(admin)/* on the caller's Firebase Auth ID-token
 * carrying the `admin` custom claim. The same claim is what the deployed
 * Cloud Functions (setAdmin / revokeAdmin / refundPurchase / banUser) and
 * the Firestore rules check, so a missing claim here means the user
 * couldn't perform any admin action even if the UI were rendered.
 *
 * --- TODO(15.4 hardening, follow-up sessions) ---
 *
 * 1. Server-side session cookie verification.
 *    The check below runs in the client. A motivated attacker could rip
 *    the page open and just hit the Cloud Functions directly — they'd be
 *    blocked there, but we still leak admin UI shapes. The proper fix:
 *    use Firebase Admin SDK in a Next.js Route Handler to mint a session
 *    cookie via `auth.createSessionCookie()`, then verify it inside a
 *    server component before rendering. That requires a service-account
 *    JSON in env vars (FIREBASE_SERVICE_ACCOUNT_*).
 *
 * 2. Hardware-key 2FA enforcement.
 *    Firebase Auth supports multi-factor (TOTP / SMS / passkeys). Until
 *    the service-account flow is in, admin sign-in should require the
 *    second factor. The simplest path is enrolling each admin in the
 *    Firebase MFA flow and gating this layout on
 *    `user.multiFactor.enrolledFactors.length > 0`. Even simpler is
 *    fronting the admin route with a Cloudflare Access or a passkey-only
 *    SSO if the team has one — that keeps Firebase client unchanged.
 *
 * Both are out of scope for the first pass: 15.4 ships the route shell,
 * the client guard, and the first usable page. The hardening lands in a
 * follow-up session before any non-Apon-Industries admin gets a claim.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [claimChecked, setClaimChecked] = useState(false);
  const [hasAdminClaim, setHasAdminClaim] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // forceRefresh: true so a freshly granted/revoked admin claim is
        // picked up on this navigation — the ID token caches for ~1h.
        const result = await user.getIdTokenResult(true);
        if (cancelled) return;
        const isAdmin = result.claims.admin === true;
        setHasAdminClaim(isAdmin);
        setClaimChecked(true);
      } catch (err) {
        if (cancelled) return;
        console.warn("admin layout: claim check failed", err);
        setHasAdminClaim(false);
        setClaimChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, router, pathname]);

  if (loading || !user || !claimChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!hasAdminClaim) {
    return <AdminAccessDenied onSignOut={() => auth.signOut()} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-secondary to-tertiary glow-primary" />
            <span className="font-bold tracking-tight text-fg-strong">
              Hitbox Admin
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <AdminNavLink href="/admin/feed" current={pathname}>
              Feed
            </AdminNavLink>
            <AdminNavLink href="/admin/users" current={pathname}>
              Users
            </AdminNavLink>
            <AdminNavLink href="/admin/refunds" current={pathname}>
              Refunds
            </AdminNavLink>
            <AdminNavLink href="/admin/moderation" current={pathname}>
              Moderation
            </AdminNavLink>
            <AdminNavLink href="/admin/audit" current={pathname}>
              Audit
            </AdminNavLink>
            <button
              type="button"
              onClick={() => auth.signOut()}
              className="text-fg-muted hover:text-fg-strong transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string;
  children: ReactNode;
}) {
  const active = current === href || current.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={
        active
          ? "text-fg-strong font-medium"
          : "text-fg-muted hover:text-fg-strong transition-colors"
      }
    >
      {children}
    </Link>
  );
}

function AdminAccessDenied({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-xl font-semibold text-fg-strong">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Your account doesn&apos;t carry the <code>admin</code> custom
          claim. If you believe this is a mistake, ask another admin to
          run <code>setAdmin</code> for your uid (or use{" "}
          <code>functions/scripts/set-admin.js</code> for the bootstrap
          admin), then sign out and back in to refresh your token.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-fg-strong hover:bg-white/15 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
