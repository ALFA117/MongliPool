import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { connectWallet as rawConnect } from "./wallet";

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