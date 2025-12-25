import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  email?: string;
  created_at: string;
};

const MOCK_CUSTOMERS: Customer[] = [
  { id: "cust_001", name: "John Smith", email: "john@example.com", created_at: "2025-12-20" },
  { id: "cust_002", name: "Sarah Johnson", email: "sarah@example.com", created_at: "2025-12-21" },
];

export default function CustomersPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Customers</h1>
          <p style={{ marginTop: 8, color: "#666" }}>
            This is a placeholder list. Next we’ll replace it with Supabase data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Next step: open a modal or route to /admin/customers/new")}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          + New Customer
        </button>
      </header>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.6fr",
            gap: 0,
            padding: "10px 12px",
            background: "#f7f7f7",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Created</div>
          <div></div>
        </div>

        {MOCK_CUSTOMERS.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.6fr",
              padding: "12px",
              borderTop: "1px solid #eee",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800 }}>{c.name}</div>
            <div style={{ color: "#666" }}>{c.email ?? "—"}</div>
            <div style={{ color: "#666" }}>{c.created_at}</div>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={() => alert(`Open customer: ${c.id} (next step)`)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/admin">← Back to Admin</Link>
        <span style={{ color: "#bbb" }}>|</span>
        <Link href="/">Public Home</Link>
      </div>
    </div>
  );
}
