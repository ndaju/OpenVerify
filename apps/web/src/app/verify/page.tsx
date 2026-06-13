"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiRequest, storeAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type VerifyState = "loading" | "invalid" | "expired" | "used" | "valid" | "success" | "error";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const guild = searchParams.get("guild");
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [discordId, setDiscordId] = useState("");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!token || !guild) {
      setState("invalid");
      return;
    }

    apiRequest<{ valid: boolean; discordId: string }>(
      `/api/verify/token?token=${token}&guild=${guild}`
    )
      .then((data) => {
        if (data.valid) {
          setDiscordId(data.discordId);
          setState("valid");
        }
      })
      .catch((err) => {
        const msg = err.message || "";
        if (msg.includes("expired")) setState("expired");
        else if (msg.includes("used")) setState("used");
        else if (msg.includes("Invalid")) setState("invalid");
        else {
          setState("error");
          setErrorMsg(msg);
        }
      });
  }, [token, guild]);

  const handleVerify = async () => {
    if (!token || !guild || !isAuthenticated) return;

    try {
      await apiRequest("/api/verify/callback", {
        method: "POST",
        body: JSON.stringify({ token, guildId: guild }),
      });
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message || "Verification failed");
    }
  };

  const handleLoginFirst = () => {
    router.push(`/login?redirect=/verify?token=${token}&guild=${guild}`);
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-surface-1000 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-400 animate-spin" />
            <p className="text-gray-400">Checking verification link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const states = {
    invalid: { icon: XCircle, color: "text-red-400", title: "Invalid Link", desc: "This verification link is invalid. Please request a new one from the server." },
    expired: { icon: XCircle, color: "text-amber-400", title: "Link Expired", desc: "This verification link has expired. Please rejoin the server to get a new one." },
    used: { icon: XCircle, color: "text-amber-400", title: "Already Used", desc: "This verification link has already been used. You should already have the verified role." },
    error: { icon: XCircle, color: "text-red-400", title: "Error", desc: errorMsg || "Something went wrong. Please try again." },
    valid: { icon: Shield, color: "text-indigo-400", title: "Verify Your Account", desc: "Click the button below to verify your identity and gain access to the server." },
    success: { icon: CheckCircle, color: "text-emerald-400", title: "Verified!", desc: "You have been successfully verified! You can close this page and return to Discord." },
  };

  const s = states[state];

  return (
    <div className="min-h-screen bg-surface-1000 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <div className={`p-3 rounded-full w-fit mx-auto mb-4 bg-surface-800 ${s.color}`}>
            <s.icon className="w-10 h-10" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">{s.title}</h1>
          <p className="text-sm text-gray-400 mb-6">{s.desc}</p>

          {discordId && (
            <p className="text-xs text-gray-500 mb-4">
              Discord ID: {discordId}
            </p>
          )}

          {state === "valid" && (
            <>
              {isAuthenticated ? (
                <Button onClick={handleVerify} size="lg" className="w-full">
                  <Shield className="w-5 h-5" />
                  Verify My Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-400">
                    You need to sign in first to verify.
                  </p>
                  <Button onClick={handleLoginFirst} size="lg" className="w-full">
                    Sign In & Verify
                  </Button>
                </div>
              )}
            </>
          )}

          {state === "success" && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-sm text-emerald-400">
                Go back to Discord — you now have access!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
