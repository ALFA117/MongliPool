import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { connectWallet as rawConnect, getAddress as rawGetAddress } from "./wallet";

interface WalletCtx {
  address: string | null;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({
  address: null,
  loading: false,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // Retry a few times — Freighter may need a moment after page load
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const addr = await rawGetAddress();
          if (addr && !cancelled) {
            setAddress(addr);
            return;
          }
        } catch { /* ignore */ }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const addr = await rawConnect();
      setAddress(addr);
    } catch (e) {
      console.error("Wallet connect failed:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, loading, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}