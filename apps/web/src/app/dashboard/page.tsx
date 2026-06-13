"use client";

import { useEffect, useState } from "react";
import { Shield, Server, Lock, Activity } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiRequest } from "@/lib/api";

interface DashboardStats {
  discordAccounts: number;
  vaults: number;
  guilds: number;
  recentActivity: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats>({
    discordAccounts: 0,
    vaults: 0,
    guilds: 0,
    recentActivity: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<{ user: any }>("/api/auth/me");
        if (data.user) {
          setStats({
            discordAccounts: data.user.discordAccounts?.length || 0,
            vaults: data.user.vaults?.length || 0,
            guilds: data.user.discordAccounts?.reduce((a: number, d: any) => a + d.guildCount, 0) || 0,
            recentActivity: 0,
          });
        }
      } catch {}
    }
    load();
  }, []);

  const cards = [
    { title: "Discord Accounts", value: stats.discordAccounts, icon: Shield, color: "bg-indigo-500/10 text-indigo-400" },
    { title: "Linked Servers", value: stats.guilds, icon: Server, color: "bg-emerald-500/10 text-emerald-400" },
    { title: "Vaults", value: stats.vaults, icon: Lock, color: "bg-amber-500/10 text-amber-400" },
    { title: "Recent Activity", value: stats.recentActivity, icon: Activity, color: "bg-blue-500/10 text-blue-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.displayName || user?.username}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Here is your OpenVerify overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-surface-900 border border-surface-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/servers"
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
            >
              <Server className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Link Discord Server</p>
                <p className="text-xs text-gray-500">Connect and manage your servers</p>
              </div>
            </a>
            <a
              href="/dashboard/vault"
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
            >
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Create Vault</p>
                <p className="text-xs text-gray-500">Store encrypted secrets securely</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-surface-800">
              <span className="text-gray-400">Role</span>
              <span className="text-gray-200 font-medium">{user?.role || "USER"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-800">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-200">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-800">
              <span className="text-gray-400">Username</span>
              <span className="text-gray-200">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">2FA</span>
              <span className={user?.twoFactorEnabled ? "text-emerald-400" : "text-gray-500"}>
                {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
