import { CheckCircle2, MessageSquare, LogIn, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityType } from "@prisma/client";

const iconFor: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  STATUS_CHANGE: CheckCircle2,
  NOTE: MessageSquare,
  CHECK_IN: LogIn,
  CHECK_OUT: LogOut,
};

export function ActivityTimeline({
  activities,
}: {
  activities: {
    id: string;
    type: ActivityType;
    description: string;
    createdAt: Date;
    author: { name: string };
  }[];
}) {
  if (activities.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {activities.map((a) => {
        const Icon = iconFor[a.type];
        return (
          <li key={a.id} className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm">{a.description}</p>
              <p className="text-xs text-muted-foreground">
                {a.author.name} · {formatDistanceToNow(a.createdAt, { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
