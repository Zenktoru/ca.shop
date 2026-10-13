"use client";

import { useCallback, useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import Struk from "@/components/Struk";

function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

const METODE = [
  { id: "tunai", label: "Tunai" },
  { id: "qris", label: "QRIS" },
  { id: "debit", label: "Debit" },
];

export default function KasirApp({ nama }) {
  // Daftar barang
  const [produk, setProduk] = useState([]);
  const [cari, setCari] = useState("");
  const [loadingProduk, setLoadingProduk] = useState(true);
  const [errorProduk, setErrorProduk] = useState("");

  // Keranjang
  const [cart, setCart] = useState([]);
  const [pesan, setPesan] = useState("");

  // Member
  const [telp, setTelp] = useState("");
  const [member, setMember] = useState(null);
  const [memberBelumAda, setMemberBelumAda] = useState(false);
  const [namaBaru, setNamaBaru] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);

  // Pembayaran
  const [metode, setMetode] = useState("tunai");
  const [bayarInput, setBayarInput] = useState("");
  const [proses, setProses] = useState(false);
  const [errorBayar, setErrorBayar] = useState("");
  const [struk, setStruk] = useState(null);

  const total = cart.reduce((jml, i) => jml + i.harga * i.qty, 0);
  const bayar = metode === "tunai" ? Number(bayarInput) || 0 : total;
  const kembalian = metode === "tunai" ? Math.max(bayar - total, 0) : 0;
  const bisaBayar = cart.length > 0 && !proses && (metode !== "tunai" || bayar >= total);

  const muatProduk = useCallback(async (q) => {
    setLoadingProduk(true);
    setErrorProduk("");
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.ok) {
        setProduk(data.data);
      } else {
        setProduk([]);
        setErrorProduk(data.error || "Gagal memuat barang.");
      }
    } catch {
      setProduk([]);
      setErrorProduk("Server tidak merespons. Cek terminal untuk pesan error.");
    } finally {
      setLoadingProduk(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => muatProduk(cari), 300);
    return () => clearTimeout(t);
  }, [cari, muatProduk]);

  // ---------- Keranjang ----------
  function tambah(p) {
    setPesan("");
    if (p.stok < 1) return;

    const ada = cart.find((i) => i.id === p.id);
    const qtySekarang = ada ? ada.qty : 0;
    if (qtySekarang + 1 > p.stok) {
      setPesan(`Stok "${p.nama}" hanya ${p.stok}.`);
      return;
    }

    setCart(
      ada
        ? cart.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...cart, { id: p.id, kode: p.kode, nama: p.nama, harga: p.harga, stok: p.stok, qty: 1 }]
    );
  }

  function ubahQty(id, nilai) {
    setPesan("");
    setCart(
      cart.map((i) => {
        if (i.id !== id) return i;
        let qty = parseInt(nilai, 10);
        if (Number.isNaN(qty) || qty < 1) qty = 1;
        if (qty > i.stok) {
          qty = i.stok;
          setPesan(`Stok "${i.nama}" hanya ${i.stok}.`);
        }
        return { ...i, qty };
      })
    );
  }

  function hapusItem(id) {
    setCart(cart.filter((i) => i.id !== id));
  }

  // Enter di kolom cari: cocok persis dengan kode (hasil scan barcode) -> langsung masuk keranjang
  async function cariEnter(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = cari.trim();
    if (!q) return;
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.ok) return;
      const cocok = data.data.find((p) => p.kode === q) || (data.data.length === 1 ? data.data[0] : null);
      if (cocok) {
        tambah(cocok);
        setCari("");
      } else {
        setPesan("Barang tidak ditemukan atau hasilnya lebih dari satu. Pilih dari daftar.");
      }
    } catch {
      setPesan("Server tidak merespons.");
    }
  }

  // ---------- Member ----------
  async function cekMember() {
    setMemberError("");
    setMemberBelumAda(false);
    const t = telp.replace(/\D/g, "");
    if (t.length < 8) {
      setMemberError("Masukkan nomor telepon yang valid.");
      return;
    }
    setMemberLoading(true);
    try {
      const res = await fetch(`/api/members?telp=${t}`);
      const data = await res.json();
      if (!res.ok) {
        setMemberError(data.error || "Gagal mencari member.");
        return;
      }
      if (data.data) setMember(data.data);
      else setMemberBelumAda(true);
    } catch {
      setMemberError("Server tidak merespons.");
    } finally {
      setMemberLoading(false);
    }
  }

  async function daftarMember() {
    setMemberError("");
    setMemberLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: namaBaru, telp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMemberError(data.error || "Gagal mendaftarkan member.");
        return;
      }
      setMember(data.data);
      setMemberBelumAda(false);
      setNamaBaru("");
    } catch {
      setMemberError("Server tidak merespons.");
    } finally {
      setMemberLoading(false);
    }
  }

  function lepasMember() {
    setMember(null);
    setTelp("");
    setMemberBelumAda(false);
    setNamaBaru("");
    setMemberError("");
  }

  // ---------- Pembayaran ----------
  async function prosesBayar() {
    if (!bisaBayar) return;
    setErrorBayar("");
    setProses(true); // mengunci tombol agar tidak terklik dua kali

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ product_id: i.id, qty: i.qty })),
          metode,
          bayar,
          member_id: member ? member.id : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorBayar(data.error || "Transaksi gagal.");
        muatProduk(cari); // stok mungkin sudah berubah
        return;
      }

      setStruk(data.data);
      setCart([]);
      setBayarInput("");
      setMetode("tunai");
      setPesan("");
      lepasMember();
      muatProduk(cari);
    } catch {
      setErrorBayar("Server tidak merespons. Cek apakah transaksi sudah tercatat sebelum mengulang.");
    } finally {
      setProses(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg">
              🛒
            </div>
            <span className="text-lg font-bold text-brand-900">ca.shop</span>
            <span className="ml-2 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              Kasir
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{nama}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-5">
        {/* ===== Kiri: daftar barang ===== */}
        <section className="lg:col-span-3">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            onKeyDown={cariEnter}
            placeholder="Cari nama / scan barcode lalu tekan Enter..."
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />

          {errorProduk && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorProduk}</p>
          )}

          {loadingProduk && produk.length === 0 && (
            <p className="mt-10 text-center text-slate-400">Memuat barang...</p>
          )}

          {!loadingProduk && produk.length === 0 && !errorProduk && (
            <p className="mt-10 text-center text-slate-400">Barang tidak ditemukan.</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {produk.map((p) => {
              const habis = p.stok < 1;
              return (
                <button
                  key={p.id}
                  onClick={() => tambah(p)}
                  disabled={habis}
                  className={`rounded-2xl border p-4 text-left transition ${
                    habis
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                      : "border-slate-200 bg-white hover:border-brand-500 hover:shadow-md active:scale-[0.98]"
                  }`}
                >
                  <p className="text-xs text-slate-400">{p.kategori}</p>
                  <p className="mt-1 font-semibold leading-tight">{p.nama}</p>
                  <p className={`mt-2 font-bold ${habis ? "" : "text-brand-700"}`}>{rupiah(p.harga)}</p>
                  <p className="mt-1 text-xs">
                    {habis ? (
                      <span className="font-medium text-red-500">Stok habis</span>
                    ) : (
                      <span className={p.stok <= 5 ? "font-medium text-amber-600" : "text-slate-400"}>
                        Stok {p.stok}
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== Kanan: keranjang & pembayaran ===== */}
        <section className="lg:col-span-2">
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-brand-900">Keranjang</h2>

            {pesan && (
              <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">{pesan}</p>
            )}

            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Belum ada barang. Klik barang di sebelah kiri.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {cart.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.nama}</p>
                      <p className="text-xs text-slate-400">{rupiah(i.harga)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => ubahQty(i.id, i.qty - 1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={i.qty}
                        onChange={(e) => ubahQty(i.id, e.target.value)}
                        className="h-7 w-12 rounded-lg border border-slate-200 text-center text-sm outline-none focus:border-brand-500"
                      />
                      <button
                        onClick={() => ubahQty(i.id, i.qty + 1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-20 text-right text-sm font-semibold">{rupiah(i.harga * i.qty)}</p>
                    <button
                      onClick={() => hapusItem(i.id)}
                      className="text-slate-300 hover:text-red-500"
                      title="Hapus"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Member */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Member</p>

              {member ? (
                <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{member.nama}</p>
                    <p className="text-xs text-brand-700">{member.no_telp}</p>
                  </div>
                  <button onClick={lepasMember} className="text-xs font-medium text-slate-500 hover:text-red-500">
                    Lepas
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={telp}
                      onChange={(e) => setTelp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), cekMember())}
                      placeholder="No. telepon member"
                      inputMode="numeric"
                      className={inputClass}
                    />
                    <button
                      onClick={cekMember}
                      disabled={memberLoading}
                      className="rounded-xl bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                      Cek
                    </button>
                  </div>

                  {memberBelumAda && (
                    <div className="mt-2 space-y-2 rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-amber-700">
                        Nomor belum terdaftar. Daftarkan sebagai member baru?
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={namaBaru}
                          onChange={(e) => setNamaBaru(e.target.value)}
                          placeholder="Nama member"
                          className={inputClass}
                        />
                        <button
                          onClick={daftarMember}
                          disabled={memberLoading || !namaBaru.trim()}
                          className="rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          Daftar
                        </button>
                      </div>
                    </div>
                  )}

                  {memberError && <p className="mt-2 text-xs text-red-600">{memberError}</p>}
                </>
              )}
            </div>

            {/* Metode bayar */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Metode pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {METODE.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetode(m.id)}
                    className={`rounded-xl border py-2 text-sm font-medium transition ${
                      metode === m.id
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {metode === "tunai" && (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    min="0"
                    value={bayarInput}
                    onChange={(e) => setBayarInput(e.target.value)}
                    placeholder="Uang diterima"
                    className={inputClass}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBayarInput(String(total))}
                      disabled={total === 0}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Uang pas
                    </button>
                    {[20000, 50000, 100000].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBayarInput(String(n))}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        {n.toLocaleString("id-ID")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ringkasan */}
            <div className="space-y-1 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-brand-700">{rupiah(total)}</span>
              </div>
              {metode === "tunai" && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Kembalian</span>
                  <span className={bayar < total && bayarInput ? "text-red-500" : ""}>
                    {bayar < total && bayarInput ? "Uang kurang" : rupiah(kembalian)}
                  </span>
                </div>
              )}
            </div>

            {errorBayar && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorBayar}</p>
            )}

            <button
              onClick={prosesBayar}
              disabled={!bisaBayar}
              className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {proses ? "Memproses..." : "Bayar"}
            </button>
          </div>
        </section>
      </main>

      {struk && <Struk data={struk} onTutup={() => setStruk(null)} />}
    </div>
  );
}