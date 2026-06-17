import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Contract,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "./wallet";

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK ?? Networks.TESTNET;
const POOL_CONTRACT_ID = import.meta.env.VITE_POOL_CONTRACT_ID ?? "";
const ASP_CONTRACT_ID = import.meta.env.VITE_ASP_CONTRACT_ID ?? "";
// Used as source account for read-only simulateTransaction calls (no signing needed).
// Must be a funded testnet account so getAccount() succeeds. Set via VITE_ADMIN_ADDRESS.
const SIM_ACCOUNT = import.meta.env.VITE_ADMIN_ADDRESS ?? "";

export const rpc = new SorobanRpc.Server(RPC_URL);

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  senderAddress: string
): Promise<xdr.ScVal> {
  const account = await rpc.getAccount(senderAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  const signedXdr = await signTransaction(assembled.toXDR(), NETWORK);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK);

  const result = await rpc.sendTransaction(signedTx);
  if (result.status === "ERROR") {
    throw new Error(`Transaction error: ${result.errorResult}`);
  }

  // Poll for completion
  let getResult = await rpc.getTransaction(result.hash);
  const start = Date.now();
  while (
    getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    Date.now() - start < 30_000
  ) {
    await new Promise((r) => setTimeout(r, 1_000));
    getResult = await rpc.getTransaction(result.hash);
  }

  if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${getResult.status}`);
  }

  return getResult.returnValue ?? xdr.ScVal.scvVoid();
}

/** Deposit into the privacy pool */
export async function deposit(
  senderAddress: string,
  commitmentHex: string, // 32-byte hex
  encryptedNote: Uint8Array
): Promise<void> {
  const commitmentBytes = Buffer.from(commitmentHex, "hex");
  const args = [
    nativeToScVal(senderAddress, { type: "address" }),
    xdr.ScVal.scvBytes(commitmentBytes),
    xdr.ScVal.scvBytes(Buffer.from(encryptedNote)),
  ];
  await invokeContract(POOL_CONTRACT_ID, "deposit", args, senderAddress);
}

/** Fetch all commitments from the pool (for Merkle tree reconstruction) */
export async function getCommitments(): Promise<string[]> {
  const contract = new Contract(POOL_CONTRACT_ID);
  const account = await rpc.getAccount(
    SIM_ACCOUNT // dummy read-only account
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("get_commitments"))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Sim error: ${sim.error}`);
  }

  const result = scValToNative(sim.result!.retval) as Buffer[];
  return result.map((b) => Buffer.from(b).toString("hex"));
}

/** Fetch pool deposit events to get encrypted notes */
export async function getDepositEvents(): Promise<
  Array<{ commitment: string; encryptedNote: Uint8Array; timestamp: number }>
> {
  // Use Soroban RPC getEvents
  const events = await rpc.getEvents({
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

  return events.events.map((e) => ({
    commitment: Buffer.from(
      (e.topic[1] as xdr.ScVal).bytes()
    ).toString("hex"),
    encryptedNote: new Uint8Array((e.value as xdr.ScVal).bytes()),
    timestamp: new Date(e.ledgerClosedAt).getTime(),
  }));
}

/** Get ASP root from registry */
export async function getAspRoot(): Promise<string | null> {
  try {
    const contract = new Contract(ASP_CONTRACT_ID);
    const account = await rpc.getAccount(
      SIM_ACCOUNT
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(contract.call("get_asp_root"))
      .setTimeout(30)
      .build();

    const sim = await rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim)) return null;

    const result = scValToNative(sim.result!.retval);
    if (!result) return null;
    return Buffer.from(result as Buffer).toString("hex");
  } catch {
    return null;
  }
}

/** Admin: update the on-chain pool Merkle root after a deposit (off-chain indexer pattern) */
export async function updatePoolRoot(adminAddress: string, rootHex: string): Promise<void> {
  const args = [xdr.ScVal.scvBytes(Buffer.from(rootHex, "hex"))];
  await invokeContract(POOL_CONTRACT_ID, "update_root", args, adminAddress);
}

/** Admin: update the ASP Merkle root (MVP: same value as pool root) */
export async function updateAspRoot(adminAddress: string, rootHex: string): Promise<void> {
  const args = [xdr.ScVal.scvBytes(Buffer.from(rootHex, "hex"))];
  await invokeContract(ASP_CONTRACT_ID, "update_asp_root", args, adminAddress);
}

/** Submit a withdrawal proof */
export async function withdraw(
  senderAddress: string,
  proofBytes: Uint8Array,
  merkleRootHex: string,
  aspRootHex: string,
  nullifierHashHex: string,
  recipientAddress: string,
  recipientFieldHex: string, // BN254 field encoding of recipientAddress, bound to proof
  amount: bigint
): Promise<void> {
  const args = [
    xdr.ScVal.scvBytes(Buffer.from(proofBytes)),
    xdr.ScVal.scvBytes(Buffer.from(merkleRootHex, "hex")),
    xdr.ScVal.scvBytes(Buffer.from(aspRootHex, "hex")),
    xdr.ScVal.scvBytes(Buffer.from(nullifierHashHex, "hex")),
    nativeToScVal(recipientAddress, { type: "address" }),
    xdr.ScVal.scvBytes(Buffer.from(recipientFieldHex, "hex")),
    xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString("0"), lo: xdr.Uint64.fromString(amount.toString()) })),
  ];
  await invokeContract(POOL_CONTRACT_ID, "withdraw", args, senderAddress);
}