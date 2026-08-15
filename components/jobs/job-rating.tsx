"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { setJobRating } from "@/lib/actions/jobs";

export function JobRating({
  jobId,
  rating,
  editable,
}: {
  jobId: string;
  rating: number | null;
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [hovered, setHovered] = useState<number | null>(null);

  if (!editable) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "h-4 w-4",
              rating && n <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
        {!rating && <span className="ml-1 text-xs text-muted-foreground">Not yet rated</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = hovered != null ? n <= hovered : rating != null && n <= rating;
        return (
          <button
            key={n}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHovered(n)}
            onClick={() =>
              startTransition(async () => {
                await setJobRating(jobId, n);
                toast.success(`Rated ${n} star${n === 1 ? "" : "s"}`);
              })
            }
            className="disabled:opacity-50"
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"
              )}
            />
          </button>
        );
      })}
      {!rating && !hovered && (
        <span className="ml-1 text-xs text-muted-foreground">Rate this job</span>
      )}
    </div>
  );
}
