import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseProduct } from "@/lib/product";

// Ubah barang (khusus admin)
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { error, data } = parseProduct(body);
    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

    const aktif = body.is_active === 0 || body.is_active === false ? 0 : 1;

    const [result] = await pool.query(
      "UPDATE products SET kode = ?, nama = ?, kategori = ?, harga = ?, stok = ?, is_active = ? WHERE id = ?",
      [data.kode, data.nama, data.kategori, data.harga, data.stok, aktif, id]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "Barang tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, error: "Kode barang sudah dipakai barang lain." },
        { status: 409 }
      );
    }
    console.error("PUT /api/products/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal mengubah barang: " + err.message },
      { status: 500 }
    );
  }
}

// Nonaktifkan barang (bukan hapus permanen, supaya riwayat transaksi aman)
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const [result] = await pool.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "Barang tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menonaktifkan barang: " + err.message },
      { status: 500 }
    );
  }
}