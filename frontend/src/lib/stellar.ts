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

  // Try progressively wider ranges — RPC retention varies on testnet
  let events = { events: [] as typeof rawEvents };
  type EventType = Awaited<ReturnType<typeof server.getEvents>>;
  let rawEvents: EventType["events"] = [];

  for (const range of [500, 2000, 8000, 17280]) {
    const startLedger = Math.max(1, latestLedger - range);
    try {
      const resp = await server.getEvents({
        startLedger,
        filters: [{ type: "contract", contractIds: [POOL_CONTRACT_ID] }],
        limit: 100,
      });
      if (resp.events.length > 0) {
        rawEvents = resp.events;
        break;
      }
    } catch { /* try wider */ }
  }

  const results: Array<{ commitment: string; encryptedNote: Uint8Array; timestamp: number }> = [];

  for (const e of rawEvents) {
    try {
      const topicVal = e.topic?.[0];
      if (!topicVal) continue;
      const topicName = typeof topicVal === "string" ? topicVal : scValToNative(topicVal as xdr.ScVal);
      if (topicName !== "deposit") continue;

      const eventData = scValToNative(e.value as xdr.ScVal) as Record<string, unknown>;
      const rawNote = eventData.encrypted_note;
      const rawCommit = eventData.commitment;

      // Ensure proper Uint8Array — scValToNative may return Buffer or typed array
      let noteBytes: Uint8Array;
      if (rawNote instanceof Uint8Array) {
        noteBytes = new Uint8Array(rawNote);
      } else if (rawNote && typeof rawNote === "object" && "data" in (rawNote as {data?: number[]})) {
        noteBytes = new Uint8Array((rawNote as {data: number[]}).data);
      } else {
        noteBytes = new Uint8Array(rawNote as ArrayBuffer);
      }

      let commitBytes: Uint8Array;
      if (rawCommit instanceof Uint8Array) {
        commitBytes = new Uint8Array(rawCommit);
      } else if (rawCommit && typeof rawCommit === "object" && "data" in (rawCommit as {data?: number[]})) {
        commitBytes = new Uint8Array((rawCommit as {data: number[]}).data);
      } else {
        commitBytes = new Uint8Array(rawCommit as ArrayBuffer);
      }

      results.push({
        commitment: uint8ArrayToHex(commitBytes),
        encryptedNote: noteBytes,
        timestamp: new Date(e.ledgerClosedAt).getTime(),
      });
    } catch {
      // Skip unparseable events
    }
  }
  return results;
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