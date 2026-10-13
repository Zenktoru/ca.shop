"use client";

function rupiah(n) {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

const NAMA_METODE = { tunai: "Tunai", qris: "QRIS", debit: "Debit" };

export default function Struk({ data, onTutup }) {
  const tanggal = new Date(data.tanggal).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-700 print:hidden">
          ✓ Transaksi berhasil
        </p>

        {/* Area yang dicetak */}
        <div id="struk-area" className="font-mono text-xs text-slate-800">
          <div className="text-center">
            <p className="text-base font-bold">ca.shop</p>
            <p>Struk Pembelian</p>
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          <div className="space-y-0.5">
            <p>No : {data.no_transaksi}</p>
            <p>Tgl: {tanggal}</p>
            <p>Kasir: {data.kasir}</p>
            {data.member && <p>Member: {data.member}</p>}
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          <div className="space-y-2">
            {data.items.map((it) => (
              <div key={it.id}>
                <p className="font-bold">{it.nama}</p>
                <div className="flex justify-between">
                  <span>
                    {it.qty} x {rupiah(it.harga)}
                  </span>
                  <span>{rupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          <div className="space-y-0.5">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>{rupiah(data.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar ({NAMA_METODE[data.metode]})</span>
              <span>{rupiah(data.bayar)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span>{rupiah(data.kembalian)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />
          <p className="text-center">Terima kasih sudah berbelanja!</p>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cetak struk
          </button>
          <button
            onClick={onTutup}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Transaksi baru
          </button>
        </div>
      </div>
    </div>
  );
}