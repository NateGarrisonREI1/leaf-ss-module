"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: string;
};

const ITEMS: Item[] = [
  { href: "/admin", label: "Home", icon: "🏠" },
  { href: "/admin/customers", label: "Customers", icon: "👤" },
  { href: "/admin/jobs", label: "Jobs", icon: "🧾" },
  { href: "/admin/snapshots", label: "LEAF System Snapshots", icon: "🧩" },
  { href: "/admin/systems", label: "Systems Catalog" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <nav className="rei-nav">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rei-navItem"
          data-active={isActive(item.href) ? "true" : "false"}
        >
          <span className="rei-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
