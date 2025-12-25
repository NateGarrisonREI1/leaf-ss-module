import Link from "next/link";
import { MOCK_JOBS } from "../../_data/mockJobs";

export default function JobDetailPage({
  params,
  searchParams,
}: {
  params: { jobId: string };
  searchParams?: {
    customerName?: string;
    address?: string;
    sqft?: string;
    yearBuilt?: string;
    reportId?: string;
  };
}) {
  const job = MOCK_JOBS.find((j) => j.id === params.jobId);

  const customerName = job?.customerName ?? searchParams?.customerName ?? "Unnamed Customer";
  const address = job?.address ?? searchParams?.address ?? "—";
  const sqft = job?.sqft ?? (searchParams?.sqft ? Number(searchParams.sqft) : undefined);
  const yearBuilt = job?.yearBuilt ?? (searchParams?.yearBuilt ? Number(searchParams.yearBuilt) : undefined);
  const reportId = job?.reportId ?? searchParams?.reportId ?? params.jobId;

  const systems = job?.systems ?? [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header card */}
      <div className="rei-card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
              {customerName} —{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {reportId}
              </span>
            </div>
            <div style={{ color: "var(--muted)" }}>{address}</div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
              <div>
                <b style={{ color: "var(--text)" }}>Sq Ft:</b> {sqft ?? "—"}
              </div>
              <div>
                <b style={{ color: "var(--text)" }}>Year Built:</b> {yearBuilt ?? "—"}
              </div>
              <div>
                <b style={{ color: "var(--text)" }}>Systems:</b> {systems.length}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link className="rei-btn" href="/admin/jobs" style={{ textDecoration: "none", color: "inherit" }}>
              ← Jobs
            </Link>
            <button className="rei-btn rei-btnPrimary" type="button" disabled>
              Generate Mock Report
            </button>
          </div>
        </div>
      </div>

      {/* Files panel (placeholder) */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>Inspection Upload</div>
        <div style={{ color: "var(--muted)", marginBottom: 12 }}>
          Placeholder: upload inspection/HES PDFs here (Supabase Storage later).
        </div>

        <button className="rei-btn" type="button" disabled style={{ border: "1px solid var(--border)", background: "transparent" }}>
          Upload Inspection PDF (coming next)
        </button>
      </div>

      {/* Systems list (still mock for now) */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>Existing Systems</div>

        {systems.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            No systems on this mock job yet. Next step: we’ll add the worksheet/intake panel here and create systems from it.
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.4fr 0.7fr 0.7fr 0.9fr 1fr",
                gap: 10,
                padding: "12px 14px",
                background: "rgba(16,24,40,.03)",
                fontWeight: 900,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <div>Type</div>
              <div>Subtype</div>
              <div>Age</div>
              <div>Operational</div>
              <div>Wear</div>
              <div />
            </div>

            {systems.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.4fr 0.7fr 0.7fr 0.9fr 1fr",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid var(--border)",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 900 }}>{s.type}</div>
                <div style={{ color: "var(--muted)" }}>{s.subtype}</div>
                <div style={{ color: "var(--muted)" }}>{s.ageYears} yrs</div>
                <div style={{ color: "var(--muted)" }}>{s.operational}</div>
                <div style={{ color: "var(--muted)" }}>{s.wear}/5</div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Link
                    className="rei-btn rei-btnPrimary"
                    href={`/admin/snapshots/new?jobId=${encodeURIComponent(params.jobId)}&systemId=${encodeURIComponent(s.id)}`}
                    style={{ textDecoration: "none" }}
                  >
                    Create Snapshot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
