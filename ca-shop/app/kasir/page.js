import { getSession } from "@/lib/auth";
import KasirApp from "@/components/KasirApp";

export default async function KasirPage() {
  const session = await getSession();
  return <KasirApp nama={session?.nama ?? ""} />;
}