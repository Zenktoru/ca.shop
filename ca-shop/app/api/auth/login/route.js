import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Membaca data login
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: "Username dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Memastikan koneksi database tersedia
    const [rows] = await pool.execute(
      `SELECT id, nama, username, password, role, is_active
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    const user = rows[0];

    // Memeriksa username dan password
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Username atau password salah.",
        },
        { status: 401 }
      );
    }

    const passwordCocok = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCocok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Username atau password salah.",
        },
        { status: 401 }
      );
    }

    // Memeriksa status akun
    if (
      user.is_active === 0 ||
      user.is_active === false ||
      user.is_active === "0"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Akun nonaktif. Hubungi admin.",
        },
        { status: 403 }
      );
    }

    // Membuat token autentikasi
    const token = await signToken({
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    });

    // Mengirim respons dan cookie login
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      nama: user.nama,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    // Catat error asli di Vercel Runtime Logs
    console.error("[LOGIN ERROR]", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}