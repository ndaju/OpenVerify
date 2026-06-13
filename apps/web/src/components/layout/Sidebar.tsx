"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Server,
  Shield,
  MessageSquare,
  Lock,
  LogOut,
  User,
  Settings,
  Activity,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/servers", label: "Servers", icon: Server },
  { href: "/dashboard/vault", label: "Vault", icon: Lock },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-surface-950 border-r border-surface-800 flex flex-col h-screen flex-shrink-0">
      <div className="p-5 border-b border-surface-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-400" />
          <span className="text-lg font-bold text-white">OpenVerify</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-surface-800"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-800 space-y-1">
        <Link
          href="/dashboard/activity"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-surface-800 transition-all duration-200"
        >
          <Activity className="w-5 h-5" />
          Activity
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-surface-800 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <User className="w-5 h-5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 truncate">{user?.username || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
