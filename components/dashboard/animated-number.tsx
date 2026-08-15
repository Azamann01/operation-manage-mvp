"use client";

import { useEffect, useRef, useState } from "react";
import { formatGBP } from "@/lib/currency";

type FormatType = "number" | "gbp" | "percent" | "days" | "hours" | "rating";

function applyFormat(type: FormatType | undefined, n: number): string {
  switch (type) {
    case "gbp":
      return formatGBP(n);
    case "percent":
      return `${Math.round(n)}%`;
    case "days":
      return `${n.toFixed(1)}d`;
    case "hours":
      return `${n.toFixed(1)}h`;
    case "rating":
      return `${n.toFixed(1)}/5`;
    default:
      return Math.round(n).toLocaleString("en-GB");
  }
}

export function AnimatedNumber({
  value,
  formatType,
  duration = 600,
}: {
  value: number;
  formatType?: FormatType;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const mounted = useRef(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevRef.current = value;
      return;
    }

    const start = prevRef.current;
    const startTime = performance.now();
    let raf: number;

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        prevRef.current = value;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{applyFormat(formatType, display)}</>;
}
