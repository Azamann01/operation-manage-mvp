"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/jobs";

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function syncOverdueNotifications(userId: string) {
  const overdueJobs = await db.job.findMany({
    where: { status: { in: OPEN_STATUSES }, dueDate: { lt: new Date() } },
    select: { id: true, title: true },
  });

  if (overdueJobs.length === 0) return;

  const existing = await db.notification.findMany({
    where: { userId, type: "JOB_OVERDUE", jobId: { in: overdueJobs.map((j) => j.id) } },
    select: { jobId: true },
  });
  const existingJobIds = new Set(existing.map((n) => n.jobId));

  const toCreate = overdueJobs.filter((j) => !existingJobIds.has(j.id));
  if (toCreate.length === 0) return;

  await db.notification.createMany({
    data: toCreate.map((j) => ({
      userId,
      type: "JOB_OVERDUE" as const,
      title: "Job overdue",
      description: `"${j.title}" is past its due date.`,
      jobId: j.id,
    })),
  });
}

export async function getNotifications() {
  const session = await requireSession();

  if (session.user.role === "ADMIN") {
    await syncOverdueNotifications(session.user.id);
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return { notifications, unreadCount };
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/admin");
  revalidatePath("/employee");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/admin");
  revalidatePath("/employee");
}
