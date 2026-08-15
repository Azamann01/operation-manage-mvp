"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JobStatus } from "@prisma/client";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function requireJobAccess(jobId: string) {
  const session = await requireSession();
  if (session.user.role === "ADMIN") return session;

  const assignment = await db.jobAssignment.findFirst({
    where: { jobId, employeeId: session.user.id },
  });
  if (!assignment) throw new Error("Unauthorized");
  return session;
}

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  siteId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  price: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || !Number.isNaN(Number(v)), "Price must be a number"),
  vatExempt: z.enum(["on"]).nullable().optional(),
});

export async function createJob(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    customerId: formData.get("customerId"),
    siteId: formData.get("siteId"),
    priority: formData.get("priority") || "MEDIUM",
    scheduledDate: formData.get("scheduledDate"),
    dueDate: formData.get("dueDate"),
    price: formData.get("price"),
    vatExempt: formData.get("vatExempt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, description, customerId, siteId, priority, scheduledDate, dueDate, price, vatExempt } =
    parsed.data;

  const job = await db.job.create({
    data: {
      title,
      description,
      customerId,
      siteId: siteId ? siteId : null,
      priority,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      price: price !== undefined ? Number(price) : null,
      vatExempt: vatExempt === "on",
      createdById: session.user.id,
    },
  });

  await db.jobActivity.create({
    data: {
      jobId: job.id,
      authorId: session.user.id,
      type: "NOTE",
      description: `Job "${title}" created.`,
    },
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  return {};
}

export async function deleteJob(id: string) {
  await requireAdmin();
  await db.job.delete({ where: { id } });
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
}

export async function assignEmployees(jobId: string, employeeIds: string[]) {
  const session = await requireAdmin();

  const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
  const previousAssignments = await db.jobAssignment.findMany({ where: { jobId } });
  const previouslyAssignedIds = new Set(previousAssignments.map((a) => a.employeeId));
  const newlyAssignedIds = employeeIds.filter((id) => !previouslyAssignedIds.has(id));

  await db.jobAssignment.deleteMany({ where: { jobId } });
  if (employeeIds.length > 0) {
    await db.jobAssignment.createMany({
      data: employeeIds.map((employeeId) => ({ jobId, employeeId })),
    });
  }

  const employees = employeeIds.length
    ? await db.user.findMany({ where: { id: { in: employeeIds } } })
    : [];

  if (newlyAssignedIds.length > 0) {
    await db.notification.createMany({
      data: newlyAssignedIds.map((employeeId) => ({
        userId: employeeId,
        type: "JOB_ASSIGNED" as const,
        title: "New job assigned",
        description: `You've been assigned to "${job.title}".`,
        jobId,
      })),
    });
  }

  await db.jobActivity.create({
    data: {
      jobId,
      authorId: session.user.id,
      type: "NOTE",
      description:
        employees.length > 0
          ? `Assigned to ${employees.map((e) => e.name).join(", ")}.`
          : "Unassigned all employees.",
    },
  });

  if (job.status === "PENDING" && employees.length > 0) {
    await db.job.update({ where: { id: jobId }, data: { status: "ASSIGNED" } });
    await db.jobActivity.create({
      data: {
        jobId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        description: "Status changed to ASSIGNED.",
      },
    });
  } else if (job.status === "ASSIGNED" && employees.length === 0) {
    await db.job.update({ where: { id: jobId }, data: { status: "PENDING" } });
    await db.jobActivity.create({
      data: {
        jobId,
        authorId: session.user.id,
        type: "STATUS_CHANGE",
        description: "Status changed to PENDING.",
      },
    });
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  revalidatePath("/employee");
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const session = await requireJobAccess(jobId);

  const job = await db.job.update({
    where: { id: jobId },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  await db.jobActivity.create({
    data: {
      jobId,
      authorId: session.user.id,
      type: "STATUS_CHANGE",
      description: `Status changed to ${status.replace("_", " ")}.`,
    },
  });

  if (status === "COMPLETED") {
    const admins = await db.user.findMany({
      where: { role: "ADMIN", id: { not: session.user.id } },
    });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "JOB_COMPLETED" as const,
          title: "Job completed",
          description: `"${job.title}" was marked complete by ${session.user.name}.`,
          jobId,
        })),
      });
    }
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/employee/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  revalidatePath("/employee");
}

const noteSchema = z.object({
  description: z.string().min(1, "Note cannot be empty"),
});

export async function addJobNote(
  jobId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireJobAccess(jobId);

  const parsed = noteSchema.safeParse({ description: formData.get("description") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const job = await db.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { assignments: true },
  });
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  const recipientIds = new Set<string>([
    ...admins.map((a) => a.id),
    ...job.assignments.map((a) => a.employeeId),
  ]);
  recipientIds.delete(session.user.id);

  if (recipientIds.size > 0) {
    await db.notification.createMany({
      data: Array.from(recipientIds).map((userId) => ({
        userId,
        type: "NOTE_ADDED" as const,
        title: "New note",
        description: `${session.user.name} added a note to "${job.title}".`,
        jobId,
      })),
    });
  }

  await db.jobActivity.create({
    data: {
      jobId,
      authorId: session.user.id,
      type: "NOTE",
      description: parsed.data.description,
    },
  });

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/employee/jobs/${jobId}`);
  return {};
}

export async function setJobRating(jobId: string, rating: number) {
  await requireAdmin();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  await db.job.update({ where: { id: jobId }, data: { rating } });
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
}
