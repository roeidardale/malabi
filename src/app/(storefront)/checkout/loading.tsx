import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-72 w-full rounded-md" />
    </div>
  );
}
