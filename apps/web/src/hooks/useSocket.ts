"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnected = useSocketStore((s) => s.setConnected);
  const addOnlineUser = useSocketStore((s) => s.addOnlineUser);
  const removeOnlineUser = useSocketStore((s) => s.removeOnlineUser);
  const updateTyping = useSocketStore((s) => s.updateTyping);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connectSocket(accessToken);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("user:online", ({ userId }: { userId: string }) => {
      addOnlineUser({ userId });
    });

    socket.on("user:offline", ({ userId }: { userId: string }) => {
      removeOnlineUser(userId);
    });

    socket.on("typing:update", (data: { userId: string; channelId: string; isTyping: boolean }) => {
      updateTyping(data);
    });

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [isAuthenticated, accessToken, setConnected, addOnlineUser, removeOnlineUser, updateTyping]);
}
