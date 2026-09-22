"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { reorderFromOrder } from "@/server/actions/cart";

export function ReorderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const result = await reorderFromOrder(orderId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.unavailableCount > 0) {
        toast.warning(
          `נוספו ${result.addedCount} מוצרים לסל. ${result.unavailableCount} מוצרים אינם זמינים יותר`,
        );
      } else {
        toast.success(`נוספו ${result.addedCount} מוצרים לסל`);
      }
      router.push("/cart");
    });
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "מוסיף..." : "הזמן שוב"}
    </Button>
  );
}
