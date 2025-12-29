import { createSupabaseServerClient } from "../../../lib/supabaseServer";

type Row = {
  id: string;
  display_name: string | null;
  system_type: string | null;
  manufacturer: string | null;
  model: string | null;
  fuel_type: string | null;
  is_active: boolean | null;
};

export default async function SystemCatalogPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("system_catalog")
    .select("id, display_name, system_type, manufacturer, model, fuel_type, is_active")
    .order("display_name", { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>System Catalog</h1>
        <p style={{ marginTop: 6, marginBottom: 0, color: "#666" }}>
          Read-only view (Phase 2C · Step 2.6)
        </p>
      </div>

      {/* server-safe hover styling */}
      <style>{`
        .rei-table tbody tr:hover { background: #fcfcfc; }
      `}</style>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 600 }}>Systems</div>
          <div style={{ color: "#666", fontSize: 13 }}>
            {error ? "Error" : `${rows.length} row${rows.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {error ? (
          <div style={{ padding: 16, color: "#b91c1c" }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Failed to load</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {error.message}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No systems found</div>
            <div style={{ color: "#666" }}>
              Add a seed record in Supabase to verify the UI renders.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="rei-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", textAlign: "left" }}>
                  {["Display Name", "Type", "Manufacturer", "Model", "Fuel", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        fontSize: 12,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                      {r.display_name ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{r.system_type ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>{r.manufacturer ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>{r.model ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>{r.fuel_type ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: "1px solid",
                          borderColor: r.is_active ? "#86efac" : "#fecaca",
                          background: r.is_active ? "#f0fdf4" : "#fef2f2",
                          color: r.is_active ? "#166534" : "#991b1b",
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: r.is_active ? "#22c55e" : "#ef4444",
                            display: "inline-block",
                          }}
                        />
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, color: "#6b7280", fontSize: 12 }}>
        Next: add “Create / Edit / Deactivate” actions (Phase 2C · Step 2.7).
      </div>
    </div>
  );
}

