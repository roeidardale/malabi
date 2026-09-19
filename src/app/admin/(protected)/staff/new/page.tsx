import { createStaffAccount } from "@/server/actions/admin-staff";
import { ErrorBanner } from "@/components/ui/error-banner";
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
      <h1 className="mb-6 text-display-md">חשבון צוות חדש</h1>

      {error ? (
        <ErrorBanner className="mb-4 max-w-xl">{error}</ErrorBanner>
      ) : null}

      <StaffForm action={createStaffAccount} />
    </div>
  );
}
