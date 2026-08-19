import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export const avatarTints = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
]
