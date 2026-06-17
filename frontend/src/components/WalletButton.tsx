import { useState, useEffect } from "react";
import { connectWallet, getAddress } from "../lib/wallet";

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAddress().then(setAddress);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (e) {
      console.error("Wallet connect failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-2 bg-pool-surface border border-pool-border rounded-xl px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-pool-green animate-pulse" />
        <span className="font-mono text-xs text-pool-text-dim">
          {address.slice(0, 4)}…{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} disabled={loading} className="btn-primary py-2 px-4 text-sm">
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Conectando…
        </span>
      ) : (
        "Conectar Wallet"
      )}
    </button>
  );
}