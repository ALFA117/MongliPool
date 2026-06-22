import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { connectWallet as rawConnect } from "./wallet";
import { Keypair } from "@stellar/stellar-sdk";

interface WalletCtx {
  address: string | null;
  loading: boolean;
  isGuest: boolean;
  connect: () => Promise<void>;
  connectAsGuest: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({
  address: null,
  loading: false,
  isGuest: false,
  connect: async () => {},
  connectAsGuest: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const addr = await rawConnect();
      setAddress(addr);
      setIsGuest(false);
    } catch (e) {
      console.error("Wallet connect failed:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const connectAsGuest = useCallback(() => {
    const kp = Keypair.random();
    sessionStorage.setItem("monglipool-guest-secret", kp.secret());
    setAddress(kp.publicKey());
    setIsGuest(true);
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.removeItem("monglipool-guest-secret");
    setAddress(null);
    setIsGuest(false);
  }, []);

  return (
    <WalletContext.Provider value={{ address, loading, isGuest, connect, connectAsGuest, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
