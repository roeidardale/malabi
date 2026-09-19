import { createStaffAccount } from "@/server/actions/admin-staff";
import { StaffForm } from "@/components/admin/StaffForm";
import { requireAdmin } from "@/server/actions/admin-guard";

export default async function NewStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin(["OWNER"]);
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">חשבון צוות חדש</h1>

      {error ? (
        <p className="mb-4 max-w-xl rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <StaffForm action={createStaffAccount} />
    </div>
  );
}
