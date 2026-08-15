"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

const siteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  address: z.string().optional(),
});

export async function createSite(
  customerId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = siteSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.site.create({ data: { ...parsed.data, customerId } });
  revalidatePath(`/admin/customers/${customerId}`);
  return {};
}

export async function updateSite(
  id: string,
  customerId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = siteSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.site.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/customers/${customerId}`);
  return {};
}

export async function deleteSite(id: string, customerId: string) {
  await requireAdmin();
  await db.site.delete({ where: { id } });
  revalidatePath(`/admin/customers/${customerId}`);
}
