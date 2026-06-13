"use client";

interface TypingIndicatorProps {
  users: { userId: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? "Someone is typing..."
      : `${users.length} people are typing...`;

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 animate-fade-in">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
      </span>
      {text}
    </div>
  );
}
