import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg">
                🛒
              </div>
              <span className="text-lg font-bold text-brand-900">ca.shop</span>
            </div>
            <AdminNav />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{session?.nama}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}