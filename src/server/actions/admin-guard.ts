import "server-only";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";

/**
 * Re-checks admin auth server-side. Every admin Server Action must call this
 * first — the proxy's cookie-presence check is only an optimistic fast path.
 */
export async function requireAdmin(): Promise<string> {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }
  return session.adminId;
}
