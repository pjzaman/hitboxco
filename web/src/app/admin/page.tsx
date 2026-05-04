import Link from "next/link";

/**
 * /admin landing page (Section 15.4).
 *
 * Per-domain pages live in subroutes (`/admin/users`, `/admin/refunds`,
 * `/admin/moderation`, etc.). Only `/admin/users` is implemented in the
 * first pass; the other tiles render as "coming soon" placeholders so
 * the layout's nav is meaningful and the route shape is locked in.
 */
export default function AdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg-strong">
          Admin
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Privileged operations. Every action here is logged to{" "}
          <code>admin_log</code> and is irreversible from this UI.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminTile
          href="/admin/feed"
          title="Feed"
          description="Compose feed posts, banners, drop releases. Archive existing entries."
          status="ready"
        />
        <AdminTile
          href="/admin/users"
          title="Users"
          description="Search by uid. Grant or revoke the admin custom claim."
          status="ready"
        />
        <AdminTile
          href="/admin/refunds"
          title="Refunds"
          description="Issue Stripe refunds against a purchase id."
          status="ready"
        />
        <AdminTile
          href="/admin/moderation"
          title="Moderation"
          description="Reports queue, hide listings, ban users."
          status="ready"
        />
        <AdminTile
          href="/admin/instances"
          title="Instances"
          description="Force-correct ownership on a collectible instance."
          status="todo"
        />
        <AdminTile
          href="/admin/evolution"
          title="Evolution"
          description="Roll back an evolution event."
          status="todo"
        />
        <AdminTile
          href="/admin/audit"
          title="Audit log"
          description="Browse the admin_log collection."
          status="ready"
        />
      </div>
    </div>
  );
}

function AdminTile({
  href,
  title,
  description,
  status,
}: {
  href: string;
  title: string;
  description: string;
  status: "ready" | "todo";
}) {
  const ready = status === "ready";
  const className =
    "group relative rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors " +
    (ready ? "hover:bg-black/30" : "opacity-60");
  const content = (
    <>
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-fg-strong">{title}</h2>
        {!ready && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fg-muted">
            soon
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-fg-muted">{description}</p>
    </>
  );
  return ready ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
