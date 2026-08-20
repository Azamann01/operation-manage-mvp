"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, UserPlus, CheckCircle2, ShieldAlert, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { Notification, NotificationType } from "@prisma/client";

const typeIcon: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  JOB_ASSIGNED: UserPlus,
  JOB_COMPLETED: CheckCircle2,
  JOB_OVERDUE: ShieldAlert,
  NOTE_ADDED: MessageSquare,
};

export function NotificationsBell({
  variant,
  initialNotifications,
  initialUnreadCount,
}: {
  variant: "admin" | "employee";
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  // The layout re-fetches notifications on every server-action revalidation, but
  // useState's initializer only runs on mount — resync during render when fresh
  // props arrive (React's documented pattern for adjusting state from props,
  // safe here since it's guarded and doesn't loop: https://react.dev/learn/you-might-not-need-an-effect).
  const [prevInitialNotifications, setPrevInitialNotifications] = useState(initialNotifications);
  if (initialNotifications !== prevInitialNotifications) {
    setPrevInitialNotifications(initialNotifications);
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }
  const [, startTransition] = useTransition();
  const jobHref = variant === "admin" ? "/admin/jobs" : "/employee/jobs";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/5 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  setUnreadCount(0);
                  await markAllNotificationsRead();
                })
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <Link
                  key={n.id}
                  href={n.jobId ? `${jobHref}/${n.jobId}` : jobHref}
                  prefetch={false}
                  onClick={() => {
                    if (!n.read) {
                      setNotifications((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                      );
                      setUnreadCount((c) => Math.max(0, c - 1));
                      startTransition(() => markNotificationRead(n.id));
                    }
                  }}
                  className={cn(
                    "flex items-start gap-2.5 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-muted/50",
                    !n.read && "bg-indigo-500/5"
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate", !n.read && "font-medium")}>{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
