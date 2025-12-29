import Link from "next/link";
import { listSystems, listSystemTypes } from "../../../lib/data/systemCatalog";

export default async function SystemsPage({
  searchParams,
}: {
  searchParams: {
    system_type?: string;
    active?: string;
    q?: string;
  };
}) {
  const systemType = searchParams.system_type ?? "";
  const activeOnly = searchParams.active === "1";
  const q = searchParams.q ?? "";

  const [types, systems] = await Promise.all([
    listSystemTypes(),
    listSystems({
      systemType: systemType || undefined,
      activeOnly,
      search: q || undefined,
    }),
  ]);

  return (
    <div>
      <h1>Systems (Phase 3)</h1>

      {/* Filters */}
      <form
        style={{
          display: "flex",
          gap: 12,
          alignItems: "end",
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>System type</div>
          <select name="system_type" defaultValue={systemType}>
            <option value="">All</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Search</div>
          <input name="q" defaultValue={q} placeholder="display name…" />
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            name="active"
            value="1"
            defaultChecked={activeOnly}
          />
          Active only
        </label>

        <button type="submit">Apply</button>
        <Link href="/admin/systems">Clear</Link>
      </form>

      {/* Table */}
      {systems.length === 0 ? (
        <p style={{ marginTop: 16 }}>No systems found.</p>
      ) : (
        <table
          style={{
            marginTop: 16,
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th align="left" style={{ paddingRight: 16 }}>
                Name
              </th>
              <th align="left" style={{ paddingRight: 16 }}>
                Type
              </th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id}>
                <td style={{ paddingRight: 16 }}>
                  <Link href={`/admin/systems/${s.id}`}>
                    {s.display_name ?? "(no name)"}
                  </Link>
                </td>
                <td style={{ paddingRight: 16 }}>
                  {s.system_type ?? "-"}
                </td>
                <td>{s.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

