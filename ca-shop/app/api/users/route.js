import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Daftar akun (khusus admin)
export async function GET() {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const [rows] = await pool.query(
      "SELECT id, nama, username, role, is_active, created_at FROM users ORDER BY is_active DESC, role ASC, nama ASC"
    );
    return NextResponse.json({ ok: true, data: rows, saya: session.id });
  } catch (err) {
    console.error("GET /api/users:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat akun: " + err.message },
      { status: 500 }
    );
  }
}

// Tambah akun baru (khusus admin)
export async function POST(request) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "kasir";

    if (!nama) {
      return NextResponse.json({ ok: false, error: "Nama wajib diisi." }, { status: 400 });
    }
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      return NextResponse.json(
        { ok: false, error: "Username 3-30 karakter: huruf, angka, titik, atau garis bawah." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)",
      [nama, username, hash, role]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, error: "Username sudah dipakai." },
        { status: 409 }
      );
    }
    console.error("POST /api/users:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan akun: " + err.message },
      { status: 500 }
    );
  }
}