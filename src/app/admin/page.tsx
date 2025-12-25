import Link from "next/link";

function CardLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        border: "1px solid #ddd",
        borderRadius: 14,
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        background: "white",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{description}</div>
    </Link>
  );
}

export default function AdminHome() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <p style={{ marginTop: 8, color: "#666" }}>
          LEAF System Snapshot — Management Console (framework)
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <CardLink title="Customers" description="Create + manage customers" href="/admin/customers" />
        <CardLink title="Jobs" description="Create + manage jobs (next)" href="/admin/jobs" />
        <CardLink title="Snapshots" description="View + edit system snapshots (next)" href="/admin/snapshots" />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/">← Back to Home</Link>
      </div>
    </div>
  );
}
