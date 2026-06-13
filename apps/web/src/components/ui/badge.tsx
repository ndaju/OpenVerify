"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  const variants = {
    default: "bg-surface-700 text-gray-300",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
