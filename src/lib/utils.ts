import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | undefined | null, fallback = "?"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Never synced";

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "Never synced";
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Last synced just now";
  if (minutes < 60) return `Last synced ${minutes} min ago`;
  if (hours < 24) return `Last synced ${hours}h ago`;
  return `Last synced ${days}d ago`;
}
