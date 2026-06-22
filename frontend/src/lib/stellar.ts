import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "./wallet";

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK ?? Networks.TESTNET;
const POOL_CONTRACT_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const ASP_CONTRACT_ID = import.meta.env.VITE_ASP_CONTRACT_ID ?? "";
const SIM_ACCOUNT = import.meta.env.VITE_ADMIN_ADDRESS ?? "";

const server = new rpc.Server(RPC_URL);

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toScBytes(data: Uint8Array): xdr.ScVal {
  return nativeToScVal(data, { type: "bytes" });
}

function toScAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

function toScI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export interface TxResult {
  returnValue: xdr.ScVal;
  hash: string;
}

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  senderAddress: string
): Promise<TxResult> {
  const account = await server.getAccount(senderAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    const msg = typeof sim.error === "string" ? sim.error : JSON.stringify(sim.error);
    throw new Error(`Simulation failed: ${msg.substring(0, 300)}`);
  }

  const assembled = rpc.assembleTransaction(tx, sim).build();
  const signedXdr = await signTransaction(assembled.toXDR(), NETWORK);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK);

  const result = await server.sendTransaction(signedTx);
  if (result.status === "ERROR") {
    let detail = "unknown error";
    try {
      const er = result.errorResult as { result?: () => { switch?: () => { name?: string } } };
      const name = er?.result?.()?.switch?.()?.name;
      if (name) detail = name;
      else detail = JSON.stringify(result.errorResult).substring(0, 300);
    } catch {
      detail = String(result.errorResult);
    }
    throw new Error(`Transaction rejected: ${detail}`);
  }

  const POLL_TIMEOUT = 60_000;
  const POLL_INTERVAL = 2_000;
  let getResult = await server.getTransaction(result.hash);
  const start = Date.now();
  while (
    getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    Date.now() - start < POLL_TIMEOUT
  ) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Transaction not confirmed after 60s. It may still be processing — check Stellar Expert.");
  }

  if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${getResult.status}`);
  }

  return {
    returnValue: getResult.returnValue ?? xdr.ScVal.scvVoid(),
    hash: result.hash,
  };
}

async function simulateReadOnly(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<xdr.ScVal> {
  const account = await server.getAccount(SIM_ACCOUNT);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Sim error: ${sim.error}`);
  }

  return sim.result!.retval;
}

export async function deposit(
  senderAddress: string,
  commitmentHex: string,
  encryptedNote: Uint8Array,
  amount: bigint
): Promise<string> {
  const args = [
    toScAddress(senderAddress),
    toScBytes(hexToUint8Array(commitmentHex)),
    toScBytes(encryptedNote),
    toScI128(amount),
  ];
  const { hash } = await invokeContract(POOL_CONTRACT_ID, "deposit", args, senderAddress);
  return hash;
}

export async function getAccountBalance(address: string): Promise<number> {
  try {
    const resp = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!resp.ok) return 0;
    const data = await resp.json();
    const xlm = data.balances?.find((b: { asset_type: string }) => b.asset_type === "native");
    return xlm ? parseFloat(xlm.balance) : 0;
  } catch {
    return 0;
  }
}

export async function getPoolDepositCount(): Promise<number> {
  try {
    const retval = await simulateReadOnly(POOL_CONTRACT_ID, "get_deposit_count");
    return scValToNative(retval) as number;
  } catch {
    return 0;
  }
}

export async function getPoolBalance(): Promise<number> {
  try {
    const retval = await simulateReadOnly(POOL_CONTRACT_ID, "get_pool_balance");
    return Number(scValToNative(retval) as bigint) / 1e7;
  } catch {
    return 0;
  }
}

export async function getCommitments(): Promise<string[]> {
  const retval = await simulateReadOnly(POOL_CONTRACT_ID, "get_commitments");
  const result = scValToNative(retval);
  if (!Array.isArray(result)) return [];
  return (result as Uint8Array[]).map((b) => uint8ArrayToHex(new Uint8Array(b)));
}

export async function getDepositEvents(): Promise<
  Array<{ commitment: string; encryptedNote: Uint8Array; timestamp: number }>
> {
  const latestLedger = (await server.getLatestLedger()).sequence;
  const startLedger = Math.max(1, latestLedger - 17280);

  const events = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds: [POOL_CONTRACT_ID],
      },
    ],
    limit: 100,
  });

  // Filter for deposit events client-side and parse the DepositEvent struct
  return events.events
    .filter((e) => {
      try {
        return scValToNative(e.topic[0] as xdr.ScVal) === "deposit";
      } catch {
        return false;
      }
    })
    .map((e) => {
      const eventData = scValToNative(e.value as xdr.ScVal) as {
        commitment: Uint8Array;
        encrypted_note: Uint8Array;
        leaf_index: number;
      };
      return {
        commitment: uint8ArrayToHex(new Uint8Array(eventData.commitment)),
        encryptedNote: new Uint8Array(eventData.encrypted_note),
        timestamp: new Date(e.ledgerClosedAt).getTime(),
      };
    });
}

export async function getAspRoot(): Promise<string | null> {
  try {
    const retval = await simulateReadOnly(ASP_CONTRACT_ID, "get_asp_root");
    const result = scValToNative(retval);
    if (!result) return null;
    return uint8ArrayToHex(new Uint8Array(result as Uint8Array));
  } catch {
    return null;
  }
}

export async function updatePoolRoot(adminAddress: string, rootHex: string): Promise<void> {
  const args = [toScBytes(hexToUint8Array(rootHex))];
  await invokeContract(POOL_CONTRACT_ID, "update_root", args, adminAddress);
}

export async function updateAspRoot(adminAddress: string, rootHex: string): Promise<void> {
  const args = [toScBytes(hexToUint8Array(rootHex))];
  await invokeContract(ASP_CONTRACT_ID, "update_asp_root", args, adminAddress);
}

export async function withdraw(
  senderAddress: string,
  proofBytes: Uint8Array,
  merkleRootHex: string,
  aspRootHex: string,
  nullifierHashHex: string,
  recipientAddress: string,
  recipientFieldHex: string,
  amount: bigint
): Promise<string> {
  const args = [
    toScBytes(proofBytes),
    toScBytes(hexToUint8Array(merkleRootHex)),
    toScBytes(hexToUint8Array(aspRootHex)),
    toScBytes(hexToUint8Array(nullifierHashHex)),
    toScAddress(recipientAddress),
    toScBytes(hexToUint8Array(recipientFieldHex)),
    toScI128(amount),
  ];
  const { hash } = await invokeContract(POOL_CONTRACT_ID, "withdraw", args, senderAddress);
  return hash;
}