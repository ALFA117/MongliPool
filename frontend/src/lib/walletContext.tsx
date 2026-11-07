import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { connectWallet as rawConnect, GUEST_SECRET_KEY } from "./wallet";
import { Keypair } from "@stellar/stellar-sdk";

interface WalletCtx {
  address: string | null;
  loading: boolean;
  isGuest: boolean;
  /** Creando y fondeando la cuenta temporal con Friendbot. */
  guestLoading: boolean;
  /** Friendbot no respondió: la cuenta temporal no se pudo fondear. */
  guestError: boolean;
  connect: () => Promise<void>;
  connectAsGuest: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({
  address: null,
  loading: false,
  isGuest: false,
  guestLoading: false,
  guestError: false,
  connect: async () => {},
  connectAsGuest: async () => {},
  disconnect: () => {},
});

function guestFromSession(): string | null {
  try {
    const secret = sessionStorage.getItem(GUEST_SECRET_KEY);
    return secret ? Keypair.fromSecret(secret).publicKey() : null;
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  // Si la pestaña ya tenía cuenta temporal (recarga o enlace directo), se recupera.
  const [address, setAddress] = useState<string | null>(() => guestFromSession());
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(() => guestFromSession() !== null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const addr = await rawConnect();
      sessionStorage.removeItem(GUEST_SECRET_KEY);
      setAddress(addr);
      setIsGuest(false);
    } catch (e) {
      console.error("Wallet connect failed:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cuenta temporal de testnet: se crea aquí, Friendbot le da XLM de prueba y las
  // transacciones se firman en la pestaña (ver signTransaction en wallet.ts).
  const connectAsGuest = useCallback(async () => {
    setGuestLoading(true);
    setGuestError(false);
    try {
      const kp = Keypair.random();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45_000);
      try {
        const res = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Friendbot ${res.status}`);
      } finally {
        clearTimeout(timer);
      }
      sessionStorage.setItem(GUEST_SECRET_KEY, kp.secret());
      setAddress(kp.publicKey());
      setIsGuest(true);
    } catch (e) {
      console.error("Guest account funding failed:", e);
      setGuestError(true);
    } finally {
      setGuestLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.removeItem(GUEST_SECRET_KEY);
    setAddress(null);
    setIsGuest(false);
  }, []);

  return (
    <WalletContext.Provider value={{ address, loading, isGuest, guestLoading, guestError, connect, connectAsGuest, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
