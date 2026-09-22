"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomer } from "./customer-guard";
import { upsertCustomerAddress, deleteCustomerAddress, setDefaultCustomerAddress } from "@/lib/addresses";

export interface AddressActionState {
  error?: string;
}

const addressSchema = z.object({
  label: z.string().trim().min(1, "יש להזין שם לכתובת (למשל בית, עבודה)"),
  street: z.string().trim().min(1, "יש להזין כתובת"),
  city: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  isDefault: z.string().optional(),
});

export async function createAddress(
  _prevState: AddressActionState | undefined,
  formData: FormData,
): Promise<AddressActionState> {
  const customer = await requireCustomer();
  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    street: formData.get("street"),
    city: formData.get("city") || "",
    notes: formData.get("notes") || "",
    isDefault: formData.get("isDefault") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  await upsertCustomerAddress(customer.id, {
    label: parsed.data.label,
    street: parsed.data.street,
    city: parsed.data.city,
    notes: parsed.data.notes,
    isDefault: parsed.data.isDefault === "on",
  });

  revalidatePath("/addresses");
  return {};
}

export async function updateAddress(
  addressId: string,
  _prevState: AddressActionState | undefined,
  formData: FormData,
): Promise<AddressActionState> {
  const customer = await requireCustomer();
  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    street: formData.get("street"),
    city: formData.get("city") || "",
    notes: formData.get("notes") || "",
    isDefault: formData.get("isDefault") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "הפרטים שהוזנו אינם תקינים" };
  }

  await upsertCustomerAddress(
    customer.id,
    {
      label: parsed.data.label,
      street: parsed.data.street,
      city: parsed.data.city,
      notes: parsed.data.notes,
      isDefault: parsed.data.isDefault === "on",
    },
    addressId,
  );

  revalidatePath("/addresses");
  return {};
}

export async function deleteAddress(addressId: string): Promise<void> {
  const customer = await requireCustomer();
  await deleteCustomerAddress(customer.id, addressId);
  revalidatePath("/addresses");
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  const customer = await requireCustomer();
  await setDefaultCustomerAddress(customer.id, addressId);
  revalidatePath("/addresses");
}
