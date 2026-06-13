"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Hash } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  discordId: string;
  name: string;
  topic: string | null;
  type: string;
  position: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get("guild") || "default";
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [guildName, setGuildName] = useState("Chat");

  useEffect(() => {
    if (guildId && guildId !== "default") {
      apiRequest<{ channels: Channel[] }>(`/api/channels/${guildId}`)
        .then((data) => {
          setChannels(data.channels);
          if (data.channels.length > 0 && !activeChannel) {
            setActiveChannel(data.channels[0].discordId);
          }
        })
        .catch(() => {});
    }
  }, [guildId]);

  const activeChannelData = channels.find((c) => c.discordId === activeChannel);

  return (
    <div className="flex h-full">
      <div className="w-60 bg-surface-950 border-r border-surface-800 flex-shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-surface-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            {guildName}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No channels available</p>
          )}
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.discordId)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                activeChannel === ch.discordId
                  ? "bg-surface-800 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-surface-800/50"
              )}
            >
              <Hash className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeChannel && activeChannelData && guildId !== "default" ? (
          <ChatWindow
            guildId={guildId}
            channelId={activeChannel}
            channelName={activeChannelData.name}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">Select a server and channel</p>
              <p className="text-sm mt-1">Choose a channel from the sidebar or visit Servers to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
