"use client";

import { create } from "zustand";

interface OnlineUser {
  userId: string;
}

interface TypingUser {
  userId: string;
  channelId: string;
  isTyping: boolean;
}

interface ChannelMessage {
  channelId: string;
  messageId: string;
  content: string;
  author: { id: string; username: string; avatarUrl: string | null };
  createdAt: string;
}

interface SocketState {
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  typingUsers: TypingUser[];
  setConnected: (connected: boolean) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  updateTyping: (typing: TypingUser) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  onlineUsers: [],
  typingUsers: [],
  setConnected: (isConnected) => set({ isConnected }),
  addOnlineUser: (user) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.some((u) => u.userId === user.userId)
        ? state.onlineUsers
        : [...state.onlineUsers, user],
    })),
  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId),
    })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  updateTyping: (typing) =>
    set((state) => {
      const filtered = state.typingUsers.filter(
        (t) => t.userId !== typing.userId || t.channelId !== typing.channelId
      );
      if (typing.isTyping) {
        return { typingUsers: [...filtered, typing] };
      }
      return { typingUsers: filtered };
    }),
}));
