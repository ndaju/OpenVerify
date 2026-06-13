"use client";

import { Lock, LockKeyhole, Eye, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, truncate } from "@/lib/utils";

interface VaultItemProps {
  vault: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    isLocked: boolean;
    accessCount: number;
    lastAccessedAt: string | null;
    createdAt: string;
    owner: { id: string; username: string; avatarUrl: string | null };
    sharedCount: number;
  };
  onSelect: () => void;
  onUnlock: () => void;
}

const visibilityLabels: Record<string, { label: string; variant: "default" | "success" | "info" | "warning" }> = {
  PRIVATE: { label: "Private", variant: "default" },
  TEAM: { label: "Team", variant: "info" },
  ORGANIZATION: { label: "Org", variant: "warning" },
  PUBLIC: { label: "Public", variant: "success" },
};

export function VaultItem({ vault, onSelect, onUnlock }: VaultItemProps) {
  const vis = visibilityLabels[vault.visibility] || visibilityLabels.PRIVATE;

  return (
    <Card className="hover:border-surface-500 transition-all duration-200 cursor-pointer group animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${vault.isLocked ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              {vault.isLocked ? (
                <Lock className={`w-5 h-5 ${vault.isLocked ? "text-amber-400" : "text-emerald-400"}`} />
              ) : (
                <LockKeyhole className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">{vault.name}</h3>
              {vault.description && (
                <p className="text-xs text-gray-500 mt-0.5">{truncate(vault.description, 40)}</p>
              )}
            </div>
          </div>
          <Badge variant={vis.variant}>{vis.label}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {vault.accessCount}
            </span>
            {vault.sharedCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {vault.sharedCount}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {vault.lastAccessedAt ? formatDate(vault.lastAccessedAt) : "Never"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUnlock}
              className="text-xs px-2.5 py-1.5 rounded-md bg-surface-800 hover:bg-surface-700 text-gray-300 hover:text-white transition-colors"
            >
              {vault.isLocked ? "Unlock" : "View"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
