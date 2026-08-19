"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient login background: a faint grid, three slow-drifting gradient
 * blobs, and a radial spotlight that tracks the cursor via a CSS custom
 * property updated directly on the DOM node (not React state) so it stays
 * smooth at 60fps without re-rendering on every mousemove. Respects
 * prefers-reduced-motion by skipping both the drift animation and the
 * mouse-tracking listener.
 */
export function LoginBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function handleMove(e: MouseEvent) {
      spotlightRef.current?.style.setProperty("--spot-x", `${e.clientX}px`);
      spotlightRef.current?.style.setProperty("--spot-y", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_120%_100%_at_50%_0%,black,transparent_85%)]" />

      <div className="absolute top-[8%] left-[8%] h-[500px] w-[500px] animate-[drift-a_16s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-indigo-500/50 blur-[110px]" />
      <div className="absolute top-[2%] right-[5%] h-[460px] w-[460px] animate-[drift-b_20s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-violet-500/45 blur-[120px]" />
      <div className="absolute top-[55%] left-[35%] h-[440px] w-[440px] animate-[drift-c_24s_ease-in-out_infinite] motion-reduce:animate-none rounded-full bg-blue-500/40 blur-[120px]" />

      <div
        ref={spotlightRef}
        className="absolute inset-0 bg-[radial-gradient(650px_circle_at_var(--spot-x,50%)_var(--spot-y,25%),rgba(199,210,254,0.3),transparent_70%)] transition-[background] duration-150 ease-out"
      />
    </div>
  );
}
