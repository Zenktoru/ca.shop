export function parseProduct(body) {
  const kode = String(body.kode ?? "").trim();
  const nama = String(body.nama ?? "").trim();
  const kategori = String(body.kategori ?? "").trim() || "Umum";
  const harga = Number(body.harga);
  const stok = Number(body.stok);

  if (!kode) return { error: "Kode barang wajib diisi." };
  if (!nama) return { error: "Nama barang wajib diisi." };
  if (body.harga === "" || body.harga == null || !Number.isInteger(harga) || harga < 0) {
    return { error: "Harga harus bilangan bulat 0 atau lebih." };
  }
  if (body.stok === "" || body.stok == null || !Number.isInteger(stok) || stok < 0) {
    return { error: "Stok harus bilangan bulat 0 atau lebih." };
  }

  return { data: { kode, nama, kategori, harga, stok } };
}