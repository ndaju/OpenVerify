"use client";

import { useState, useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { getSocket } from "@/lib/socket";
import { apiRequest } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  attachments: { id: string; filename: string; url: string; mimeType: string; size: number }[];
  reactions: { id: string; emoji: string; count: number }[];
  _count: { replies: number };
}

interface ChatWindowProps {
  guildId: string;
  channelId: string;
  channelName: string;
}

export function ChatWindow({ guildId, channelId, channelName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const typingUsers = useSocketStore((s) => s.typingUsers);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    setIsLoading(true);

    apiRequest<{ messages: Message[]; nextCursor: string | null }>(
      `/api/channels/${guildId}/${channelId}/messages?limit=50`
    )
      .then((data) => {
        setMessages(data.messages);
        setCursor(data.nextCursor);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => setIsLoading(false));

    const socket = getSocket();
    if (socket) {
      socket.emit("channel:join", channelId);

      socket.on("message:new", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      });

      socket.on("message:removed", ({ messageId }: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      });
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.emit("channel:leave", channelId);
        s.off("message:new");
        s.off("message:removed");
      }
    };
  }, [guildId, channelId]);

  const loadMore = async () => {
    if (!cursor || !hasMore) return;
    try {
      const data = await apiRequest<{ messages: Message[]; nextCursor: string | null }>(
        `/api/channels/${guildId}/${channelId}/messages?limit=50&cursor=${cursor}`
      );
      setMessages((prev) => [...data.messages, ...prev]);
      setCursor(data.nextCursor);
      if (!data.nextCursor) setHasMore(false);
    } catch {}
  };

  const handleSend = async (content: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("typing:stop", { channelId });
    }
    try {
      const data = await apiRequest<{ message: Message }>(
        `/api/channels/${guildId}/${channelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );

      const socket2 = getSocket();
      if (socket2) {
        socket2.emit("message:send", {
          channelId,
          messageId: data.message.id,
          content: data.message.content,
          author: data.message.author,
          createdAt: data.message.createdAt,
        });
      }
    } catch {}
  };

  const channelTypingUsers = typingUsers.filter(
    (t) => t.channelId === channelId && t.userId !== currentUser?.id
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-surface-700 bg-surface-900 flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">#{channelName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {hasMore && messages.length > 0 && (
          <button
            onClick={loadMore}
            className="text-xs text-indigo-400 hover:text-indigo-300 mb-2 w-full text-center py-1"
          >
            Load older messages
          </button>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.author.id === currentUser?.id}
          />
        ))}

        {channelTypingUsers.length > 0 && (
          <TypingIndicator users={channelTypingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={handleSend}
        channelId={channelId}
        placeholder={`Message #${channelName}`}
      />
    </div>
  );
}
