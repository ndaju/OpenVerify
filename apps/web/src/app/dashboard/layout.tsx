"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { apiRequest, storeAccessToken } from "@/lib/api";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiRequest<{ user: any }>("/api/auth/me");
        setAuth(data.user, "");
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-1000 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useSocket();

  return (
    <AuthGuard>
      <div className="flex h-screen bg-surface-1000">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
