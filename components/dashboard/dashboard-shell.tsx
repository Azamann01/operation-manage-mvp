"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { adminNavLinks, employeeNavLinks } from "./nav-links";
import { logoutAction } from "@/lib/actions/logout";
import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";
import type { Notification } from "@prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardShell({
  variant,
  user,
  notifications,
  quickCreate,
  children,
}: {
  variant: "admin" | "employee";
  user: { name: string; email: string; role: string };
  notifications: { notifications: Notification[]; unreadCount: number };
  quickCreate?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const links = variant === "admin" ? adminNavLinks : employeeNavLinks;
  const rootHref = variant === "admin" ? "/admin" : "/employee";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href={rootHref} className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white shadow-sm shadow-indigo-500/40">
              OF
            </div>
            <span className="hidden text-base font-semibold text-white sm:inline">
              OperFlow
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {links.map((link) => {
              const active =
                link.href === rootHref
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                    active
                      ? "text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[calc(0.75rem+1px)] h-0.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] transition-all" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-slate-700 px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px] font-medium text-slate-400">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/5 hover:text-white sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            {quickCreate}
            <NotificationsBell
              variant={variant}
              initialNotifications={notifications.notifications}
              initialUnreadCount={notifications.unreadCount}
            />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-indigo-400">
                <Avatar className="h-8 w-8 ring-1 ring-white/10 transition-transform hover:scale-105">
                  <AvatarFallback className="bg-indigo-500 text-xs font-semibold text-white">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-1.5 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem closeOnClick={false} className="p-0">
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-1.5 py-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          className={cn(
            "grid overflow-hidden border-slate-800/60 transition-[grid-template-rows] duration-200 ease-out md:hidden",
            mobileOpen ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t-0"
          )}
        >
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-1 p-3">
              {links.map((link) => {
                const active =
                  link.href === rootHref
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,#e0e7ff,transparent)]"
        />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>

      <CommandPalette links={links} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
