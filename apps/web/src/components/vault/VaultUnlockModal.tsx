"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

interface VaultUnlockModalProps {
  vaultId: string;
  vaultName: string;
  onClose: () => void;
}

export function VaultUnlockModal({ vaultId, vaultName, onClose }: VaultUnlockModalProps) {
  const [decryptedData, setDecryptedData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ data: string }>(`/api/vault/${vaultId}/unlock`, {
        method: "POST",
      });
      setDecryptedData(data.data);
      setIsRevealed(true);
    } catch (err: any) {
      setError(err.message || "Failed to unlock vault");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!decryptedData) return;
    try {
      await navigator.clipboard.writeText(decryptedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
      <Card className="w-full max-w-lg bg-surface-900 border-surface-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-white">{vaultName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {!decryptedData && !isLoading && (
            <div className="text-center py-8">
              <div className="p-3 bg-amber-500/10 rounded-full w-fit mx-auto mb-4">
                <EyeOff className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                This vault is locked. Decrypt to view its contents.
              </p>
              <Button onClick={handleUnlock} isLoading={isLoading}>
                <Eye className="w-4 h-4" />
                Decrypt & Reveal
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {decryptedData && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <div className="bg-surface-1000 border border-surface-700 rounded-lg p-4 min-h-[100px] max-h-[300px] overflow-y-auto">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono break-all">
                    {isRevealed ? decryptedData : decryptedData.replace(/./g, "•")}
                  </pre>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsRevealed(!isRevealed)}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? "Hide" : "Show"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
