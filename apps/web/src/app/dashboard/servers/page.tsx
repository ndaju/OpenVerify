"use client";

import { useEffect, useState } from "react";
import { Server, Plus, RefreshCw, ExternalLink, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  isBackedUp: boolean;
}

export default function ServersPage() {
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuilds = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ guilds: DiscordGuild[] }>("/api/discord/guilds");
      setGuilds(data.guilds);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Servers</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your Discord servers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchGuilds} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <a href="/api/discord/auth">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Link Server
            </Button>
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : guilds.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No servers linked</p>
          <p className="text-sm mt-1">Connect your Discord account to see your servers</p>
          <a href="/api/discord/auth">
            <Button className="mt-4">
              <Shield className="w-4 h-4" />
              Connect Discord
            </Button>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => (
            <Card key={guild.id} className="hover:border-surface-500 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {guild.icon ? (
                    <img src={guild.icon} alt={guild.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Server className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-100 truncate">{guild.name}</h3>
                    <Badge variant={guild.isBackedUp ? "success" : "default"}>
                      {guild.isBackedUp ? "Backed Up" : "Not Backed Up"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-surface-800">
                  <a
                    href={`/dashboard/chat?guild=${guild.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-surface-800 text-gray-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
