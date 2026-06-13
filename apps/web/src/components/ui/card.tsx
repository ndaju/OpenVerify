"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-900 border border-surface-700 rounded-xl shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn("px-5 py-4 border-b border-surface-700", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
