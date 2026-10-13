import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseProduct } from "@/lib/product";

// Daftar barang (admin dan kasir boleh melihat)
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    // Barang nonaktif hanya bisa dilihat admin
    const tampilNonaktif = session.role === "admin" && searchParams.get("all") === "1";

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, kode, nama, kategori, harga, stok, is_active
       FROM products
       WHERE (is_active = 1 OR ?) AND (nama LIKE ? OR kode LIKE ? OR kategori LIKE ?)
       ORDER BY is_active DESC, nama ASC`,
      [tampilNonaktif ? 1 : 0, like, like, like]
    );

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error("GET /api/products:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat barang: " + err.message },
      { status: 500 }
    );
  }
}

// Tambah barang (khusus admin)
export async function POST(request) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { error, data } = parseProduct(body);
    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

    await pool.query(
      "INSERT INTO products (kode, nama, kategori, harga, stok) VALUES (?, ?, ?, ?, ?)",
      [data.kode, data.nama, data.kategori, data.harga, data.stok]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, error: "Kode barang sudah dipakai barang lain." },
        { status: 409 }
      );
    }
    console.error("POST /api/products:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan barang: " + err.message },
      { status: 500 }
    );
  }
}