import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      "SELECT id, nama, username, password, role, is_active FROM users WHERE username = ? LIMIT 1",
      [String(username).trim()]
    );
    const user = rows[0];

    const passwordCocok = user && (await bcrypt.compare(password, user.password));
    if (!passwordCocok) {
      return NextResponse.json(
        { ok: false, error: "Username atau password salah." },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { ok: false, error: "Akun nonaktif. Hubungi admin." },
        { status: 403 }
      );
    }

    const token = await signToken({
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({ ok: true, role: user.role, nama: user.nama });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}