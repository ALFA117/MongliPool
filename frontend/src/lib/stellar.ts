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

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  senderAddress: string
): Promise<xdr.ScVal> {
  const account = await server.getAccount(senderAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  const assembled = rpc.assembleTransaction(tx, sim).build();
  const signedXdr = await signTransaction(assembled.toXDR(), NETWORK);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK);

  const result = await server.sendTransaction(signedTx);
  if (result.status === "ERROR") {
    throw new Error(`Transaction error: ${result.errorResult}`);
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

  return getResult.returnValue ?? xdr.ScVal.scvVoid();
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
    .setTimeout(30)
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
  encryptedNote: Uint8Array
): Promise<void> {
  const args = [
    toScAddress(senderAddress),
    toScBytes(hexToUint8Array(commitmentHex)),
    toScBytes(encryptedNote),
  ];
  await invokeContract(POOL_CONTRACT_ID, "deposit", args, senderAddress);
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
  const events = await server.getEvents({
    startLedger: 1,
    filters: [
      {
        type: "contract",
        contractIds: [POOL_CONTRACT_ID],
        topics: [["AAAADwAAAAdkZXBvc2l0AA=="]],
      },
    ],
    limit: 100,
  });

  return events.events.map((e: { topic: xdr.ScVal[]; value: xdr.ScVal; ledgerClosedAt: string }) => {
    return {
      commitment: uint8ArrayToHex(new Uint8Array(e.topic[1].bytes())),
      encryptedNote: new Uint8Array(e.value.bytes()),
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
): Promise<void> {
  const args = [
    toScBytes(proofBytes),
    toScBytes(hexToUint8Array(merkleRootHex)),
    toScBytes(hexToUint8Array(aspRootHex)),
    toScBytes(hexToUint8Array(nullifierHashHex)),
    toScAddress(recipientAddress),
    toScBytes(hexToUint8Array(recipientFieldHex)),
    toScI128(amount),
  ];
  await invokeContract(POOL_CONTRACT_ID, "withdraw", args, senderAddress);
}