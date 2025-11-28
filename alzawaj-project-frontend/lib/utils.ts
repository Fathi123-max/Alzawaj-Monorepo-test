import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a relative time string (e.g. "2 hours ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "الآن";
  }

  // Minutes
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${minutes} دقيقة`;
  }

  // Hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${hours} ساعة`;
  }

  // Days
  if (diffInSeconds < 2592000) {
    // 30 days
    const days = Math.floor(diffInSeconds / 86400);
    return `منذ ${days} يوم`;
  }

  // Weeks
  if (diffInSeconds < 31536000) {
    // ~1 year
    const weeks = Math.floor(diffInSeconds / 604800);
    return `منذ ${weeks} أسبوع`;
  }

  // Years
  const years = Math.floor(diffInSeconds / 31536000);
  return `منذ ${years} سنة`;
}
