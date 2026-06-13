"use client";

import { useEffect, useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultGrid } from "@/components/vault/VaultGrid";
import { VaultUnlockModal } from "@/components/vault/VaultUnlockModal";
import { apiRequest } from "@/lib/api";

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

export default function VaultPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockVault, setUnlockVault] = useState<{ id: string; name: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultData, setNewVaultData] = useState("");
  const [newVaultDesc, setNewVaultDesc] = useState("");

  const fetchVaults = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ vaults: Vault[] }>("/api/vault");
      setVaults(data.vaults);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVaults();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/vault", {
        method: "POST",
        body: JSON.stringify({
          name: newVaultName,
          data: newVaultData,
          description: newVaultDesc || undefined,
        }),
      });
      setShowCreateModal(false);
      setNewVaultName("");
      setNewVaultData("");
      setNewVaultDesc("");
      fetchVaults();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vault</h1>
          <p className="text-sm text-gray-400 mt-1">Encrypted secrets management</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          New Vault
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <VaultGrid
          vaults={vaults}
          onSelect={(v) => {}}
          onUnlock={(v) => setUnlockVault({ id: v.id, name: v.name })}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-surface-700">
              <h2 className="text-lg font-semibold text-white">Create Vault</h2>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                <input
                  type="text"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-1000 border border-surface-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Secret Vault"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Secret Data</label>
                <textarea
                  value={newVaultData}
                  onChange={(e) => setNewVaultData(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-1000 border border-surface-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] font-mono text-sm"
                  placeholder="Enter the secret data to encrypt..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={newVaultDesc}
                  onChange={(e) => setNewVaultDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-1000 border border-surface-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="What is this vault for?"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Lock className="w-4 h-4" />
                  Encrypt & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unlockVault && (
        <VaultUnlockModal
          vaultId={unlockVault.id}
          vaultName={unlockVault.name}
          onClose={() => setUnlockVault(null)}
        />
      )}
    </div>
  );
}
