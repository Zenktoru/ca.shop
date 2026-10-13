"use client";

import { useCallback, useEffect, useState } from "react";

const FORM_KOSONG = { nama: "", username: "", password: "", role: "kasir" };

export default function PetugasPage() {
  const [akun, setAkun] = useState([]);
  const [saya, setSaya] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMuat, setErrorMuat] = useState("");

  const [modalBuka, setModalBuka] = useState(false);
  const [editing, setEditing] = useState(null); // null = tambah baru
  const [form, setForm] = useState(FORM_KOSONG);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [lihatPw, setLihatPw] = useState(false);

  const muatAkun = useCallback(async () => {
    setLoading(true);
    setErrorMuat("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.ok) {
        setAkun(data.data);
        setSaya(data.saya);
      } else {
        setAkun([]);
        setErrorMuat(data.error || "Gagal memuat akun.");
      }
    } catch {
      setAkun([]);
      setErrorMuat("Server tidak merespons. Cek terminal untuk pesan error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatAkun();
  }, [muatAkun]);

  function bukaTambah() {
    setEditing(null);
    setForm(FORM_KOSONG);
    setError("");
    setLihatPw(false);
    setModalBuka(true);
  }

  function bukaEdit(a) {
    setEditing(a);
    setForm({ nama: a.nama, username: a.username, password: "", role: a.role });
    setError("");
    setLihatPw(false);
    setModalBuka(true);
  }

  function ubahForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function simpan(e) {
    e.preventDefault();
    setError("");

    if (!editing && form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setMenyimpan(true);
    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
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
      muatAkun();
    } catch {
      setError("Server tidak merespons dengan benar. Cek terminal untuk pesan error.");
    } finally {
      setMenyimpan(false);
    }
  }

  async function ubahStatus(a, aktifBaru) {
    const pesan = aktifBaru
      ? `Aktifkan kembali akun "${a.nama}"?`
      : `Nonaktifkan akun "${a.nama}"? Akun ini tidak akan bisa login.`;
    if (!confirm(pesan)) return;

    try {
      const res = await fetch(`/api/users/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: a.nama, role: a.role, is_active: aktifBaru ? 1 : 0 }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal mengubah status.");
    } catch {
      alert("Server tidak merespons.");
    }
    muatAkun();
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Kelola Petugas</h1>
          <p className="text-sm text-slate-500">
            Daftar akun admin dan kasir yang bisa masuk ke sistem.
          </p>
        </div>
        <button
          onClick={bukaTambah}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
        >
          + Tambah Akun
        </button>
      </div>

      {errorMuat && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMuat}</p>
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Memuat data...
                </td>
              </tr>
            )}

            {!loading && akun.length === 0 && !errorMuat && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Belum ada akun.
                </td>
              </tr>
            )}

            {!loading &&
              akun.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-slate-50 last:border-0 ${
                    a.is_active ? "" : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {a.nama}
                    {a.id === saya && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                        Kamu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {a.role === "admin" ? "Admin" : "Kasir"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.is_active ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => bukaEdit(a)}
                      className="mr-3 font-medium text-brand-600 hover:text-brand-700"
                    >
                      Ubah
                    </button>
                    {a.id !== saya &&
                      (a.is_active ? (
                        <button
                          onClick={() => ubahStatus(a, false)}
                          className="font-medium text-red-500 hover:text-red-600"
                        >
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => ubahStatus(a, true)}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          Aktifkan
                        </button>
                      ))}
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
              {editing ? "Ubah Akun" : "Tambah Akun"}
            </h2>

            <form onSubmit={simpan} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nama lengkap</label>
                <input name="nama" value={form.nama} onChange={ubahForm} className={inputClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={ubahForm}
                  disabled={!!editing}
                  placeholder="contoh: kasir2"
                  autoComplete="off"
                  className={inputClass}
                />
                {editing && (
                  <p className="mt-1 text-xs text-slate-400">Username tidak bisa diubah.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {editing ? "Password baru (opsional)" : "Password"}
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={lihatPw ? "text" : "password"}
                    value={form.password}
                    onChange={ubahForm}
                    placeholder={editing ? "Kosongkan jika tidak diganti" : "Minimal 6 karakter"}
                    autoComplete="new-password"
                    className={inputClass + " pr-24"}
                  />
                  <button
                    type="button"
                    onClick={() => setLihatPw(!lihatPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-600"
                  >
                    {lihatPw ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={ubahForm}
                  disabled={editing && editing.id === saya}
                  className={inputClass}
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
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