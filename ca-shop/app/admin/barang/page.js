"use client";

import { useCallback, useEffect, useState } from "react";

const FORM_KOSONG = { kode: "", nama: "", kategori: "", harga: "", stok: "" };

function rupiah(angka) {
  return "Rp" + Number(angka).toLocaleString("id-ID");
}

export default function BarangPage() {
  const [barang, setBarang] = useState([]);
  const [cari, setCari] = useState("");
  const [tampilNonaktif, setTampilNonaktif] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState("");

  const [modalBuka, setModalBuka] = useState(false);
  const [editing, setEditing] = useState(null); // null = tambah baru
  const [form, setForm] = useState(FORM_KOSONG);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const muatBarang = useCallback(async () => {
    setLoading(true);
    setErrorMuat("");
    try {
      const params = new URLSearchParams({ q: cari });
      if (tampilNonaktif) params.set("all", "1");
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.ok) {
        setBarang(data.data);
      } else {
        setBarang([]);
        setErrorMuat(data.error || "Gagal memuat barang.");
      }
    } catch {
      setBarang([]);
      setErrorMuat("Server tidak merespons. Cek terminal untuk pesan error.");
    } finally {
      setLoading(false);
    }
  }, [cari, tampilNonaktif]);

  // Muat ulang saat kata cari berubah (jeda 300 ms supaya tidak terlalu sering)
  useEffect(() => {
    const t = setTimeout(muatBarang, 300);
    return () => clearTimeout(t);
  }, [muatBarang]);

  function bukaTambah() {
    setEditing(null);
    setForm(FORM_KOSONG);
    setError("");
    setModalBuka(true);
  }

  function bukaEdit(b) {
    setEditing(b);
    setForm({
      kode: b.kode,
      nama: b.nama,
      kategori: b.kategori || "",
      harga: String(b.harga),
      stok: String(b.stok),
    });
    setError("");
    setModalBuka(true);
  }

  function ubahForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function simpan(e) {
    e.preventDefault();
    setError("");
    setMenyimpan(true);

    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, is_active: editing ? editing.is_active : 1 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan.");
        return;
      }
      setModalBuka(false);
      muatBarang();
    } catch {
      setError("Server tidak merespons dengan benar. Cek terminal untuk pesan error.");
    } finally {
      setMenyimpan(false);
    }
  }

  async function nonaktifkan(b) {
    if (!confirm(`Nonaktifkan "${b.nama}"? Barang tidak akan muncul di kasir.`)) return;
    try {
      const res = await fetch(`/api/products/${b.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal menonaktifkan barang.");
    } catch {
      alert("Server tidak merespons.");
    }
    muatBarang();
  }

  async function aktifkan(b) {
    try {
      const res = await fetch(`/api/products/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: b.kode,
          nama: b.nama,
          kategori: b.kategori,
          harga: b.harga,
          stok: b.stok,
          is_active: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal mengaktifkan barang.");
    } catch {
      alert("Server tidak merespons.");
    }
    muatBarang();
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      {/* Judul + tombol tambah */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Kelola Barang</h1>
          <p className="text-sm text-slate-500">Tambah, ubah, dan atur stok barang toko.</p>
        </div>
        <button
          onClick={bukaTambah}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
        >
          + Tambah Barang
        </button>
      </div>

      {/* Pencarian */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama, kode, atau kategori..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={tampilNonaktif}
            onChange={(e) => setTampilNonaktif(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Tampilkan yang nonaktif
        </label>
      </div>

      {errorMuat && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMuat}</p>
      )}

      {/* Tabel */}
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 text-right font-medium">Harga</th>
              <th className="px-4 py-3 text-right font-medium">Stok</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Memuat data...
                </td>
              </tr>
            )}

            {!loading && barang.length === 0 && !errorMuat && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {cari ? "Tidak ada barang yang cocok." : "Belum ada barang. Klik “Tambah Barang”."}
                </td>
              </tr>
            )}

            {!loading &&
              barang.map((b) => (
                <tr
                  key={b.id}
                  className={`border-b border-slate-50 last:border-0 ${
                    b.is_active ? "" : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{b.kode}</td>
                  <td className="px-4 py-3 font-medium">
                    {b.nama}
                    {!b.is_active && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{b.kategori}</td>
                  <td className="px-4 py-3 text-right">{rupiah(b.harga)}</td>
                  <td className="px-4 py-3 text-right">
                    {b.stok}
                    {b.is_active === 1 && b.stok === 0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                        Habis
                      </span>
                    )}
                    {b.is_active === 1 && b.stok > 0 && b.stok <= 5 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Menipis
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => bukaEdit(b)}
                      className="mr-3 font-medium text-brand-600 hover:text-brand-700"
                    >
                      Ubah
                    </button>
                    {b.is_active ? (
                      <button
                        onClick={() => nonaktifkan(b)}
                        className="font-medium text-red-500 hover:text-red-600"
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => aktifkan(b)}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        Aktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal tambah / ubah */}
      {modalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-brand-900">
              {editing ? "Ubah Barang" : "Tambah Barang"}
            </h2>

            <form onSubmit={simpan} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kode / Barcode
                </label>
                <input name="kode" value={form.kode} onChange={ubahForm} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama barang</label>
                <input name="nama" value={form.nama} onChange={ubahForm} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                <input
                  name="kategori"
                  value={form.kategori}
                  onChange={ubahForm}
                  placeholder="Contoh: Pakaian"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Harga (Rp)</label>
                  <input
                    name="harga"
                    type="number"
                    min="0"
                    value={form.harga}
                    onChange={ubahForm}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Stok</label>
                  <input
                    name="stok"
                    type="number"
                    min="0"
                    value={form.stok}
                    onChange={ubahForm}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBuka(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={menyimpan}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {menyimpan ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}