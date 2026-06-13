"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

export function Avatar({ src, alt = "", size = "md", className, fallback }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full object-cover flex-shrink-0", sizes[size], className)}
      />
    );
  }

  const initials = (fallback || alt || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
