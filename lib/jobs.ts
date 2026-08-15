import { isToday, startOfDay } from "date-fns";
import type { JobStatus } from "@prisma/client";

export const OPEN_STATUSES: JobStatus[] = ["PENDING", "ASSIGNED", "IN_PROGRESS"];

export function formatJobNumber(number: number): string {
  return `JOB-${String(number).padStart(4, "0")}`;
}

type JobDueInfo = { dueDate: Date | null; status: JobStatus };

export function isOpenStatus(status: JobStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

// dueDate/completedAt are calendar dates (always midnight), so overdue/on-time
// checks compare calendar days, not raw timestamps — otherwise a job due
// "today" reads as overdue for nearly the entire day.
export function isOverdue(job: JobDueInfo): boolean {
  return (
    job.dueDate != null &&
    startOfDay(job.dueDate) < startOfDay(new Date()) &&
    isOpenStatus(job.status)
  );
}

export function isDueToday(job: JobDueInfo): boolean {
  return job.dueDate != null && isToday(job.dueDate) && isOpenStatus(job.status);
}

export function isCompletedOnTime(dueDate: Date | null, completedAt: Date): boolean {
  return !dueDate || startOfDay(completedAt) <= startOfDay(dueDate);
}
