"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiRequest, storeAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const switchTab = useCallback((t: "login" | "register") => {
    setTab(t);
    setError("");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<{ accessToken: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      storeAccessToken(data.accessToken);
      setAuth(data.user, data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
        skipAuth: true,
      });
      setTab("login");
      setError("Account created! Please sign in.");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1000 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Welcome to OpenVerify</h1>
          <p className="text-sm text-gray-400 mt-1">
            {tab === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex mb-6 bg-surface-800 rounded-lg p-1">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === "login" ? "bg-surface-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === "register" ? "bg-surface-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className={`text-sm p-3 rounded-lg mb-4 ${
              error.includes("created") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {tab === "register" && (
              <Input
                id="username"
                label="Username"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            )}

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder={tab === "register" ? "At least 8 characters" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === "register" ? 8 : 1}
            />

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              {tab === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-700">
            <a
              href="/api/discord/auth"
              className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.1776-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
              Continue with Discord
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
