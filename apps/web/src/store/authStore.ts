"use client";

import { create } from "zustand";

interface DiscordAccount {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  guildCount: number;
}

interface VaultSummary {
  id: string;
  name: string;
  isLocked: boolean;
  visibility: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  twoFactorEnabled: boolean;
  isVerified: boolean;
  createdAt: string;
  discordAccounts: DiscordAccount[];
  vaults: VaultSummary[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
