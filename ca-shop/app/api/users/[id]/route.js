import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Ubah akun: nama, role, status aktif, dan (opsional) password baru
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const nama = String(body.nama ?? "").trim();
    const role = body.role === "admin" ? "admin" : "kasir";
    const aktif = body.is_active === 0 || body.is_active === false ? 0 : 1;
    const passwordBaru = String(body.password ?? "");

    if (!nama) {
      return NextResponse.json({ ok: false, error: "Nama wajib diisi." }, { status: 400 });
    }
    if (passwordBaru && passwordBaru.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Admin tidak boleh menonaktifkan / menurunkan role dirinya sendiri
    if (Number(id) === Number(session.id) && (aktif === 0 || role !== "admin")) {
      return NextResponse.json(
        { ok: false, error: "Kamu tidak bisa menonaktifkan atau menurunkan role akunmu sendiri." },
        { status: 400 }
      );
    }

    let result;
    if (passwordBaru) {
      const hash = await bcrypt.hash(passwordBaru, 10);
      [result] = await pool.query(
        "UPDATE users SET nama = ?, role = ?, is_active = ?, password = ? WHERE id = ?",
        [nama, role, aktif, hash, id]
      );
    } else {
      [result] = await pool.query(
        "UPDATE users SET nama = ?, role = ?, is_active = ? WHERE id = ?",
        [nama, role, aktif, id]
      );
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "Akun tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/users/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal mengubah akun: " + err.message },
      { status: 500 }
    );
  }
}