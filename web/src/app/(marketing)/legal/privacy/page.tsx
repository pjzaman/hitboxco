import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy · Hitbox",
  description:
    "How Hitbox collects, uses, and protects information you share with the platform.",
  alternates: { canonical: "/legal/privacy" },
  robots: { index: true, follow: true },
};

/**
 * Privacy policy — Section 17.1 of the hardening doc.
 *
 * NOTE: this is a SCAFFOLD with placeholder content. Before launch:
 *   • have legal counsel review and amend.
 *   • confirm the third-party SDKs list matches what's actually shipped
 *     (Firebase Auth/Firestore/Storage/Functions, Stripe, NFC scan).
 *   • specify retention windows that match your actual deletes/exports.
 *   • update the contact email + jurisdiction footer.
 *
 * Until that review happens this page is intentionally generic.
 */
export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 space-y-8 prose-invert">
      <header>
        <div className="text-xs uppercase tracking-wider text-fg-muted mb-3">
          Legal
        </div>
        <h1 className="text-4xl font-bold text-fg-strong tracking-tight">
          Privacy policy
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          Last updated: 2026-05-03 · This is a draft scaffold pending
          legal review.
        </p>
      </header>

      <Section title="1. Information we collect">
        <p>
          When you create an account we collect your email address,
          display name, and the unique identifier your auth provider
          (Google, password) returns. When you make a purchase we route
          payment through Stripe and store a Stripe customer id and
          last-four card metadata — never the full card number. When you
          scan a Hitbox NFC tag we record the chip&apos;s public identity,
          the timestamp, and the user uid that performed the scan.
        </p>
      </Section>

      <Section title="2. How we use information">
        <p>
          To operate the platform: authenticate you, attribute purchases
          and trades, run the recommendation feed, and contact you about
          drops you&apos;ve opted into. We do not sell personal information.
        </p>
      </Section>

      <Section title="3. Sharing with third parties">
        <p>
          Hitbox uses Firebase (Google) for authentication, database,
          storage, and Cloud Functions; Stripe for payments; and
          analytics providers as disclosed in the cookie banner. Each
          processor is bound by a data-processing agreement and may not
          use your information for unrelated purposes.
        </p>
      </Section>

      <Section title="4. Retention">
        <p>
          Account-bound records are kept while your account is active and
          for a reasonable period after closure to fulfill legal,
          accounting, and dispute-resolution obligations. Audit logs of
          administrative actions are retained for seven years.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>
          You can request access, correction, or deletion of your
          information by emailing{" "}
          <a
            href="mailto:privacy@hitbox.app"
            className="underline decoration-dotted hover:text-primary"
          >
            privacy@hitbox.app
          </a>
          . Where required by law (GDPR, CCPA, equivalents) we honor
          regional rights including data portability and objection to
          certain processing.
        </p>
      </Section>

      <Section title="6. Changes">
        <p>
          We&apos;ll post material changes here and notify active accounts
          by email. Continued use after a change constitutes acceptance.
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-fg-strong mb-2">{title}</h2>
      <div className="text-fg-muted leading-relaxed">{children}</div>
    </section>
  );
}
