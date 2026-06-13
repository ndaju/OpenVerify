"use client";

import { VaultItem } from "./VaultItem";

interface Vault {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  isLocked: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; username: string; avatarUrl: string | null };
  sharedCount: number;
}

interface VaultGridProps {
  vaults: Vault[];
  onSelect: (vault: Vault) => void;
  onUnlock: (vault: Vault) => void;
}

export function VaultGrid({ vaults, onSelect, onUnlock }: VaultGridProps) {
  if (vaults.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">No vaults yet</p>
        <p className="text-sm mt-1">Create your first vault to store secrets securely</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vaults.map((vault) => (
        <VaultItem
          key={vault.id}
          vault={vault}
          onSelect={() => onSelect(vault)}
          onUnlock={() => onUnlock(vault)}
        />
      ))}
    </div>
  );
}
