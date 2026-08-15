"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createCustomer(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.customer.create({ data: parsed.data });
  revalidatePath("/admin/customers");
  return {};
}

export async function updateCustomer(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.customer.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return {};
}

export async function deleteCustomer(id: string) {
  await requireAdmin();
  await db.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
}
