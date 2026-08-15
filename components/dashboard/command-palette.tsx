"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, LogOut, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/logout";
import type { NavLink } from "./nav-links";

export function CommandPalette({
  links,
  open,
  onOpenChange,
}: {
  links: NavLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setOpen = onOpenChange;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  type Item = { key: string; label: string; hint: string; action: () => void };

  const items = useMemo<Item[]>(() => {
    const navItems: Item[] = links.map((l) => ({
      key: l.href,
      label: l.label,
      hint: "Go to",
      action: () => router.push(l.href),
    }));
    return [
      ...navItems,
      {
        key: "sign-out",
        label: "Sign out",
        hint: "Action",
        action: () => logoutAction(),
      },
    ];
  }, [links, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
    setOpen(next);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function runItem(item: Item) {
    item.action();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && filtered[activeIndex]) {
                e.preventDefault();
                runItem(filtered[activeIndex]);
              }
            }}
            placeholder="Jump to a page or action..."
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results.</p>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => runItem(item)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  i === activeIndex
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-2">
                  {item.key === "sign-out" && <LogOut className="h-3.5 w-3.5" />}
                  {item.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {item.hint}
                  {i === activeIndex && <CornerDownLeft className="h-3 w-3" />}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
