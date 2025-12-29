import Link from "next/link";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/system-catalog", label: "System Catalog" },
  { href: "/admin/compatibility", label: "Compatibility" },
  { href: "/admin/admin-parameters", label: "Admin Parameters" },
  { href: "/admin/incentives", label: "Incentives" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/snapshots", label: "Snapshots" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r min-h-screen p-4">
      <div className="text-sm font-semibold tracking-wide">REI • Admin</div>
      <nav className="mt-4 flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

