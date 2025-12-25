import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "270px 1fr",
        minHeight: "100vh",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        background: "#f6f7fb",
        color: "#101828",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: "#fff",
          borderRight: "1px solid #e7e9f0",
          padding: "18px 14px",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(67,164,25,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "#43a419",
            }}
          >
            REI
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>
              Renewable Energy Incentives
            </div>
            <div style={{ fontSize: 12, color: "#667085" }}>
              Management Console
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Link href="/admin">Home</Link>
          <Link href="/admin/customers">Customers</Link>
          <Link href="/admin/jobs">Jobs</Link>
          <Link href="/admin/snapshots">LEAF System Snapshots</Link>
        </nav>

        <div style={{ marginTop: "auto", fontSize: 12, color: "#667085", paddingTop: 16 }}>
          v0 (scaffold)
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
