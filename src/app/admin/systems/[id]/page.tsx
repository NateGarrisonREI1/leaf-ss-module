import Link from "next/link";
import { supabaseServer } from "../../../../lib/supabase/server";
import { toggleSystemActive } from "./actions";

export default async function SystemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();

  const systemId = params.id;

  const { data: system, error } = await supabase
    .from("system_catalog")
    .select(
      `
      id,
      display_name,
      system_type,
      description,
      manufacturer,
      model,
      fuel_type,
      is_active,
      created_at,
      updated_at
    `
    )
    .eq("id", systemId)
    .maybeSingle();

  if (error || !system) {
    return (
      <div>
        <Link href="/admin/systems">← Back to Systems</Link>
        <p style={{ marginTop: 16 }}>System not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/systems">← Back to Systems</Link>

      <h1 style={{ marginTop: 12 }}>
        {system.display_name ?? "(no display name)"}
      </h1>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <Field label="System type" value={system.system_type} />
        
<Field label="Status" value={system.is_active ? "Active" : "Inactive"} />
<form
  action={async () => {
    "use server";
    await toggleSystemActive(system.id, !system.is_active);
  }}
>
  <button type="submit" style={{ marginTop: 4 }}>
    Set {system.is_active ? "Inactive" : "Active"}
  </button>
</form>

        <Field label="Description" value={system.description} />
        <Field label="Tags" value={(system.tags ?? []).join(", ")} />
        <Field
          label="Compatibility"
          value={
            system.compatibility
              ? JSON.stringify(system.compatibility, null, 2)
              : ""
          }
          pre
        />
        <Field label="Created" value={system.created_at} />
        <Field label="Updated" value={system.updated_at} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  pre,
}: {
  label: string;
  value?: string | null;
  pre?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
        {label}
      </div>
      {pre ? (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {value || "-"}
        </pre>
      ) : (
        <div>{value || "-"}</div>
      )}
    </div>
  );
}

