import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Cari member berdasarkan nomor telepon
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const telp = (searchParams.get("telp") || "").replace(/\D/g, "");
    if (telp.length < 8) {
      return NextResponse.json({ ok: false, error: "Nomor telepon tidak valid." }, { status: 400 });
    }

    const [rows] = await pool.query(
      "SELECT id, nama, no_telp FROM members WHERE no_telp = ? LIMIT 1",
      [telp]
    );
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (err) {
    console.error("GET /api/members:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal mencari member: " + err.message },
      { status: 500 }
    );
  }
}

// Daftarkan member baru
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const telp = String(body.telp ?? "").replace(/\D/g, "");

    if (!nama) {
      return NextResponse.json({ ok: false, error: "Nama member wajib diisi." }, { status: 400 });
    }
    if (telp.length < 8 || telp.length > 15) {
      return NextResponse.json({ ok: false, error: "Nomor telepon tidak valid." }, { status: 400 });
    }

    const [result] = await pool.query("INSERT INTO members (nama, no_telp) VALUES (?, ?)", [
      nama,
      telp,
    ]);
    return NextResponse.json({
      ok: true,
      data: { id: result.insertId, nama, no_telp: telp },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, error: "Nomor telepon sudah terdaftar." },
        { status: 409 }
      );
    }
    console.error("POST /api/members:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan member: " + err.message },
      { status: 500 }
    );
  }
}