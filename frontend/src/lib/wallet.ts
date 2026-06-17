import { StellarWalletsKit, WalletNetwork, FREIGHTER_ID, FreighterModule } from "@creit.tech/stellar-wallets-kit";

let kit: StellarWalletsKit | null = null;

export function getWalletsKit(): StellarWalletsKit {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: (import.meta.env.VITE_STELLAR_NETWORK as WalletNetwork) ?? WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule()],
    });
  }
  return kit;
}

export async function connectWallet(): Promise<string> {
  const k = getWalletsKit();
  await k.openModal({
    onWalletSelected: async (option) => {
      k.setWallet(option.id);
    },
  });
  const { address } = await k.getAddress();
  return address;
}

export async function getAddress(): Promise<string | null> {
  try {
    const k = getWalletsKit();
    const { address } = await k.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function signTransaction(xdr: string, networkPassphrase: string): Promise<string> {
  const k = getWalletsKit();
  const { signedTxXdr } = await k.signTransaction(xdr, { networkPassphrase });
  return signedTxXdr;
}