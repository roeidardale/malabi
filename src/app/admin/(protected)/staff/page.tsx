import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { requireAdmin } from "@/server/actions/admin-guard";
import { setStaffActive } from "@/server/actions/admin-staff";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "בעלים / מנהל כללי",
  DELIVERY_MANAGER: "מנהל משלוחים",
  DRIVER: "נהג",
};

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: currentAdminId } = await requireAdmin(["OWNER"]);
  const { error } = await searchParams;

  const staff = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">צוות</h1>
        <Link href="/admin/staff/new">
          <Button variant="primary">חשבון חדש</Button>
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-2 text-start">שם</th>
              <th className="px-3 py-2 text-start">אימייל</th>
              <th className="px-3 py-2 text-start">תפקיד</th>
              <th className="px-3 py-2 text-start">סטטוס</th>
              <th className="px-3 py-2 text-start">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border/50">
                <td className="px-3 py-2">{member.name}</td>
                <td className="px-3 py-2 text-muted">{member.email}</td>
                <td className="px-3 py-2">{ROLE_LABELS[member.role] ?? member.role}</td>
                <td className="px-3 py-2">
                  {member.isActive ? (
                    <span className="rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-black">
                      פעיל
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-deep px-2 py-1 text-xs text-muted">
                      מושבת
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {member.id === currentAdminId ? (
                    <span className="text-xs text-muted">(את/ה)</span>
                  ) : (
                    <form action={setStaffActive.bind(null, member.id, !member.isActive)}>
                      <Button type="submit" variant="secondary">
                        {member.isActive ? "השבתה" : "הפעלה"}
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
