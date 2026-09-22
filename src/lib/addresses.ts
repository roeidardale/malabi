import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DELIVERY_CITY } from "@/lib/money";

export interface AddressInput {
  label: string;
  street: string;
  city?: string;
  notes?: string | null;
  isDefault?: boolean;
}

/**
 * Creates (or updates, if `addressId` is given) an address for a customer,
 * handling the "exactly one default per customer" invariant the same way
 * ProductVariant.isDefault is handled in admin-products.ts: unset any prior
 * default in the same transaction as setting the new one.
 */
export async function upsertCustomerAddress(
  customerId: string,
  data: AddressInput,
  addressId?: string,
) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const fields = {
      label: data.label,
      street: data.street,
      city: data.city || DEFAULT_DELIVERY_CITY,
      notes: data.notes || null,
      isDefault: data.isDefault ?? false,
    };

    if (addressId) {
      return tx.address.update({
        where: { id: addressId, customerId },
        data: fields,
      });
    }

    const existingCount = await tx.address.count({ where: { customerId } });

    return tx.address.create({
      data: {
        ...fields,
        customerId,
        // A customer's first saved address becomes their default automatically.
        isDefault: fields.isDefault || existingCount === 0,
      },
    });
  });
}

/** Deletes an address; if it was the default, promotes the most recently updated remaining one. */
export async function deleteCustomerAddress(customerId: string, addressId: string) {
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.address.deleteMany({ where: { id: addressId, customerId } });
    if (deleted.count === 0) return;

    const stillHasDefault = await tx.address.findFirst({ where: { customerId, isDefault: true } });
    if (stillHasDefault) return;

    const nextDefault = await tx.address.findFirst({
      where: { customerId },
      orderBy: { updatedAt: "desc" },
    });
    if (nextDefault) {
      await tx.address.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
    }
  });
}

export async function setDefaultCustomerAddress(customerId: string, addressId: string) {
  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId, isDefault: true }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id: addressId, customerId }, data: { isDefault: true } }),
  ]);
}
