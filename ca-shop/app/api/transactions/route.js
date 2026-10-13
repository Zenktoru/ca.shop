import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { randomUUID } from "crypto";

const METODE = ["tunai", "qris", "debit"];

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Belum login." }, { status: 401 });
  }

  let conn;
  try {
    const body = await request.json();

    if (!METODE.includes(body.metode)) {
      return NextResponse.json({ ok: false, error: "Metode pembayaran tidak valid." }, { status: 400 });
    }

    // Gabungkan item yang sama, dan pastikan jumlahnya valid
    const qtyMap = new Map();
    for (const it of Array.isArray(body.items) ? body.items : []) {
      const id = Number(it.product_id);
      const qty = Number(it.qty);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) {
        return NextResponse.json({ ok: false, error: "Data keranjang tidak valid." }, { status: 400 });
      }
      qtyMap.set(id, (qtyMap.get(id) || 0) + qty);
    }
    if (qtyMap.size === 0) {
      return NextResponse.json({ ok: false, error: "Keranjang masih kosong." }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Kunci baris barang selama transaksi berjalan, supaya stok tidak bisa
    // dipakai dua kasir sekaligus
    const [produk] = await conn.query(
      "SELECT id, nama, harga, stok, is_active FROM products WHERE id IN (?) FOR UPDATE",
      [[...qtyMap.keys()]]
    );
    const peta = new Map(produk.map((p) => [p.id, p]));

    let total = 0;
    const baris = [];
    for (const [id, qty] of qtyMap) {
      const p = peta.get(id);
      if (!p || !p.is_active) {
        await conn.rollback();
        return NextResponse.json(
          { ok: false, error: "Ada barang yang sudah tidak tersedia. Muat ulang halaman." },
          { status: 400 }
        );
      }
      if (p.stok < qty) {
        await conn.rollback();
        return NextResponse.json(
          { ok: false, error: `Stok "${p.nama}" tidak cukup (sisa ${p.stok}).` },
          { status: 409 }
        );
      }
      const subtotal = p.harga * qty;
      total += subtotal;
      baris.push({ id: p.id, nama: p.nama, harga: p.harga, qty, subtotal });
    }

    // Total dihitung di server, bukan dari browser
    let bayar = total;
    let kembalian = 0;
    if (body.metode === "tunai") {
      bayar = Number(body.bayar);
      if (!Number.isInteger(bayar) || bayar < total) {
        await conn.rollback();
        return NextResponse.json(
          { ok: false, error: "Uang yang diterima kurang dari total." },
          { status: 400 }
        );
      }
      kembalian = bayar - total;
    }

    let member = null;
    if (body.member_id) {
      const [m] = await conn.query("SELECT id, nama, no_telp FROM members WHERE id = ?", [
        Number(body.member_id),
      ]);
      if (!m[0]) {
        await conn.rollback();
        return NextResponse.json({ ok: false, error: "Member tidak ditemukan." }, { status: 400 });
      }
      member = m[0];
    }

    // Nomor sementara (maks. 24 karakter, muat di kolom 30), lalu diganti nomor final
    const noSementara = "TMP-" + randomUUID().replace(/-/g, "").slice(0, 20);

    const [ins] = await conn.query(
      `INSERT INTO transactions (no_transaksi, kasir_id, member_id, metode_bayar, total, bayar, kembalian)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [noSementara, session.id, member ? member.id : null, body.metode, total, bayar, kembalian]
    );
    const trxId = ins.insertId;

    const sekarang = new Date();
    const dua = (n) => String(n).padStart(2, "0");
    const tanggal = `${sekarang.getFullYear()}${dua(sekarang.getMonth() + 1)}${dua(sekarang.getDate())}`;
    const noTrx = `CS-${tanggal}-${String(trxId).padStart(5, "0")}`;
    await conn.query("UPDATE transactions SET no_transaksi = ? WHERE id = ?", [noTrx, trxId]);

    // Simpan rincian barang + kurangi stok
    for (const b of baris) {
      await conn.query(
        `INSERT INTO transaction_items (transaction_id, product_id, nama_barang, harga_satuan, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [trxId, b.id, b.nama, b.harga, b.qty, b.subtotal]
      );
      await conn.query("UPDATE products SET stok = stok - ? WHERE id = ?", [b.qty, b.id]);
    }

    const [[waktu]] = await conn.query("SELECT created_at FROM transactions WHERE id = ?", [trxId]);
    await conn.commit();

    return NextResponse.json({
      ok: true,
      data: {
        no_transaksi: noTrx,
        tanggal: waktu.created_at,
        kasir: session.nama,
        member: member ? member.nama : null,
        items: baris,
        total,
        metode: body.metode,
        bayar,
        kembalian,
      },
    });
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    console.error("POST /api/transactions:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memproses transaksi: " + err.message },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}