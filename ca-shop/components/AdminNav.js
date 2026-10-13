"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/barang", label: "Barang" },
  { href: "/admin/petugas", label: "Petugas" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {MENU.map((m) => {
        const aktif = m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              aktif
                ? "bg-brand-50 text-brand-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}