import Link from "next/link";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();

  const [[ringkas]] = await pool.query(
    `SELECT
       COUNT(*) AS total_barang,
       COALESCE(SUM(stok), 0) AS total_stok,
       COALESCE(SUM(stok <= 5), 0) AS stok_menipis
     FROM products WHERE is_active = 1`
  );

  const kartu = [
    { label: "Jumlah barang aktif", nilai: ringkas.total_barang, warna: "text-brand-700" },
    { label: "Total stok", nilai: ringkas.total_stok, warna: "text-slate-800" },
    { label: "Stok menipis (≤ 5)", nilai: ringkas.stok_menipis, warna: "text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Halo, {session?.nama} 👋</h1>
      <p className="mt-1 text-slate-500">Ringkasan toko hari ini.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className={`mt-2 text-3xl font-bold ${k.warna}`}>{Number(k.nilai)}</p>
          </div>
        ))}
      </div>

      <Link
        href="/admin/barang"
        className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
      >
        Kelola barang →
      </Link>
    </div>
  );
}