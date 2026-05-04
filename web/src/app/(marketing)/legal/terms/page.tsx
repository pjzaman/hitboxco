import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service · Hitbox",
  description:
    "Terms governing your use of the Hitbox platform, marketplace, and collectibles.",
  alternates: { canonical: "/legal/terms" },
  robots: { index: true, follow: true },
};

/**
 * Terms of service — Section 17.1.
 *
 * SCAFFOLD only — pre-launch this needs legal counsel review for the
 * marketplace, fees, refunds, intellectual property, and dispute
 * resolution clauses to match how the platform actually operates.
 */
export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-fg-muted mb-3">
          Legal
        </div>
        <h1 className="text-4xl font-bold text-fg-strong tracking-tight">
          Terms of service
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          Last updated: 2026-05-03 · This is a draft scaffold pending
          legal review.
        </p>
      </header>

      <Section title="1. Acceptance">
        <p>
          By creating a Hitbox account or using the platform you agree to
          these terms and to the privacy policy. If you don&apos;t agree,
          stop using the platform.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least the age of majority in your jurisdiction
          (typically 18). Accounts representing organizations bind the
          organization to these terms.
        </p>
      </Section>

      <Section title="3. Collectibles and NFC items">
        <p>
          Hitbox collectibles are physical-digital items: a physical
          object with an NFC tag, plus a digital record stored on the
          Hitbox backend. Buying or trading a collectible transfers the
          digital record between accounts; the physical item is your
          property to keep, gift, or hand off. Counterfeits and modified
          tags are not authentic Hitbox items and do not grant any
          digital ownership.
        </p>
      </Section>

      <Section title="4. Marketplace and trades">
        <p>
          Listings, trades, and payments execute through Stripe and
          server-side functions. Hitbox is the marketplace operator; the
          counterparty in any trade is another Hitbox member, not Hitbox
          itself, except for first-sale drops issued by Hitbox or by an
          artist on Hitbox.
        </p>
      </Section>

      <Section title="5. Fees and payouts">
        <p>
          Fees per transaction are disclosed at the time of the listing
          or purchase. Artists receive payouts on the schedule disclosed
          in their onboarding agreement.
        </p>
      </Section>

      <Section title="6. Refunds">
        <p>
          Refund requests for first-sale drops are evaluated case by case
          by Hitbox. Secondary-market trades between members are final
          unless fraud is established.
        </p>
      </Section>

      <Section title="7. Conduct">
        <p>
          You agree not to: list counterfeit items; misrepresent
          collectibles; harass other members; use the platform for
          unlawful purposes; or attempt to circumvent the NFC
          authentication, App Check, or any other security mechanism.
          Violations result in listing removal, account suspension, and,
          in severe cases, permanent ban.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          Artists retain copyright in the underlying creative work
          accompanying a drop. Buying a collectible grants you a personal
          license to display and resell the digital record; it does not
          assign copyright.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          You can close your account at any time by emailing support.
          Hitbox can suspend or terminate accounts that violate these
          terms or pose risk to other members.
        </p>
      </Section>

      <Section title="10. Disclaimer and limitation of liability">
        <p>
          The platform is provided &quot;as is&quot;. To the maximum
          extent permitted by law, Hitbox disclaims implied warranties
          and limits liability to the amounts paid by you to Hitbox in
          the twelve months preceding the claim.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These terms are governed by the laws of the jurisdiction where
          Hitbox is incorporated. Disputes are resolved in those courts
          unless mandatory consumer-protection law in your country
          provides otherwise.
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
