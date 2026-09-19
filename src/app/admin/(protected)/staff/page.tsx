import Link from "next/link";
import { Users } from "lucide-react";
import { ErrorBanner } from "@/components/ui/error-banner";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/server/actions/admin-guard";
import { setStaffActive } from "@/server/actions/admin-staff";
import { StaffActiveToggle } from "@/components/admin/StaffActiveToggle";

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
        <h1 className="text-display-md">צוות</h1>
        <Link href="/admin/staff/new">
          <Button variant="primary">חשבון חדש</Button>
        </Link>
      </div>

      {error ? <ErrorBanner className="mb-4">{error}</ErrorBanner> : null}

      {staff.length === 0 ? (
        <EmptyState icon={Users} title="אין אנשי צוות עדיין" />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>{ROLE_LABELS[member.role] ?? member.role}</TableCell>
                <TableCell>
                  <Badge tone={member.isActive ? "accent" : "neutral"}>
                    {member.isActive ? "פעיל" : "מושבת"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.id === currentAdminId ? (
                    <span className="text-xs text-muted-foreground">(את/ה)</span>
                  ) : (
                    <form action={setStaffActive.bind(null, member.id, !member.isActive)}>
                      <StaffActiveToggle isActive={member.isActive} memberName={member.name} />
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
