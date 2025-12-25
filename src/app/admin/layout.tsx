import "./admin.css";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rei-admin">
      <div className="rei-shell">
        {/* SIDEBAR */}
        <aside className="rei-sidebar">
          {/* Brand */}
          <div className="rei-brand">
            <div className="rei-brandMark">REI</div>
            <div className="rei-brandText">
              <strong>Renewable Energy Incentives</strong>
              <span>Management Console</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="rei-nav">
            <Link className="rei-navItem" href="/admin">
              <span className="rei-icon" aria-hidden="true">🏠</span>
              <span>Home</span>
            </Link>

            <Link className="rei-navItem" href="/admin/customers">
              <span className="rei-icon" aria-hidden="true">👤</span>
              <span>Customers</span>
            </Link>

            <Link className="rei-navItem" href="/admin/jobs">
              <span className="rei-icon" aria-hidden="true">🧾</span>
              <span>Jobs</span>
            </Link>

            <Link className="rei-navItem" href="/admin/snapshots">
              <span className="rei-icon" aria-hidden="true">🧩</span>
              <span>LEAF System Snapshots</span>
            </Link>
          </nav>

          <div style={{ marginTop: "auto", fontSize: 12, color: "var(--muted)", padding: "14px 8px 0" }}>
            <div style={{ fontWeight: 800 }}>v0 (scaffold)</div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="rei-main">
          {/* Top bar (simple for now; we’ll add titles later) */}
          <header className="rei-topbar">
            <div>
              <div className="rei-title">REI Admin</div>
              <div className="rei-subtitle">LEAF System Snapshot console</div>
            </div>
            <div className="rei-avatar">N</div>
          </header>

          <div className="rei-content">{children}</div>
        </section>
      </div>
    </div>
  );
}
