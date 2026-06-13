"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface MessageInputProps {
  onSend: (content: string) => void;
  channelId: string;
  placeholder?: string;
}

export function MessageInput({ onSend, channelId, placeholder = "Type a message..." }: MessageInputProps) {
  const [content, setContent] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("typing:start", { channelId });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { channelId });
    }, 2000);
  }, [channelId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setContent("");

    const socket = getSocket();
    if (socket) {
      socket.emit("typing:stop", { channelId });
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    emitTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-3 border-t border-surface-700 bg-surface-900 flex-shrink-0">
      <div className="flex items-center gap-3 bg-surface-800 rounded-lg px-4 py-2 border border-surface-600 focus-within:border-indigo-500 transition-colors">
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          maxLength={4000}
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="text-indigo-400 hover:text-indigo-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
