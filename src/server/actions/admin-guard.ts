import "server-only";
import { redirect } from "next/navigation";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

/** Each role's landing page — used when redirecting away from a route/action
 * a role isn't allowed to use, so the redirect never bounces back to a page
 * that role also can't see. */
const ROLE_HOME: Record<AdminRole, string> = {
  OWNER: "/admin",
  DELIVERY_MANAGER: "/admin/dispatch",
  DRIVER: "/admin/my-deliveries",
};

/**
 * Re-checks admin auth server-side. Every admin Server Action must call this
 * first — the proxy's cookie-presence check is only an optimistic fast path.
 * Pass `allowedRoles` to also restrict the action to specific roles; omit it
 * for actions any authenticated staff member may call.
 */
export async function requireAdmin(
  allowedRoles?: AdminRole[]
): Promise<{ id: string; role: AdminRole }> {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    session.destroy();
    redirect("/admin/login");
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    redirect(ROLE_HOME[admin.role]);
  }

  return { id: admin.id, role: admin.role };
}
