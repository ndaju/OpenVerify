"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
    attachments: { id: string; filename: string; url: string; mimeType: string; size: number }[];
    reactions: { id: string; emoji: string; count: number }[];
    _count: { replies: number };
  };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const displayName = message.author.displayName || message.author.username;

  return (
    <div className={`flex gap-3 group px-2 py-1 rounded-lg hover:bg-surface-800/50 transition-colors ${isOwn ? "flex-row-reverse" : ""}`}>
      <Avatar
        src={message.author.avatarUrl}
        alt={displayName}
        size="sm"
        fallback={displayName}
      />

      <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-200">{displayName}</span>
          <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
        </div>

        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                {att.filename}
              </a>
            ))}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {message.reactions.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-800 rounded text-xs"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}

        {message._count.replies > 0 && (
          <button className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">
            {message._count.replies} {message._count.replies === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}
