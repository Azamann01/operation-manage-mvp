"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  jobTitle: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function createEmployee(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    jobTitle: formData.get("jobTitle"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "A user with this email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      jobTitle: parsed.data.jobTitle,
      passwordHash,
      role: "EMPLOYEE",
    },
  });

  revalidatePath("/admin/employees");
  return {};
}

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().optional(),
});

export async function updateEmployee(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    jobTitle: formData.get("jobTitle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.user.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/employees");
  return {};
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  await requireAdmin();
  await db.user.update({ where: { id }, data: { active } });
  revalidatePath("/admin/employees");
}
