"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-3 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-gray-100 placeholder-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          "transition-all duration-200",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
