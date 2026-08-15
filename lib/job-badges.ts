import type { JobStatus, JobPriority } from "@prisma/client";

export function statusVariant(
  status: JobStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "outline";
    case "ASSIGNED":
      return "secondary";
    case "IN_PROGRESS":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
  }
}

export function priorityVariant(
  priority: JobPriority
): "default" | "secondary" | "outline" | "destructive" {
  switch (priority) {
    case "LOW":
      return "outline";
    case "MEDIUM":
      return "secondary";
    case "HIGH":
      return "destructive";
  }
}

export const statusLabel: Record<JobStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
