import Link from "next/link";

export default function AdminHome() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <p style={{ marginTop: 8, color: "#666" }}>
          This is the LEAF System Snapshot admin scaffold. Next we’ll wire Supabase + auth.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <Card title="Customers" desc="Create & manage customers" href="/admin/customers" />
        <Card title="Jobs" desc="Track jobs per customer" href="/admin/jobs" />
        <Card title="Snapshots" desc="Build LEAF system snapshots" href="/admin/snapshots" />
      </section>

      <div style={{ marginTop: 8 }}>
        <Link href="/">← Back to public site</Link>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 16,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{desc}</div>
    </Link>
  );
}
