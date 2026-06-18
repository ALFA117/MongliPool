/**
 * Reproduce the deposit() XDR construction and simulate against testnet RPC.
 * No browser, no Freighter — just Node.js + stellar-sdk.
 * Run: node scripts/test_deposit_xdr.mjs
 */
import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Contract,
  Address,
  nativeToScVal,
  Keypair,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const POOL_CONTRACT_ID = "CDGY6VEK6EOCNA2DIM2PCYQGUVOYHB4G76I6A65MRHQ6MUCXA5EHTSMN";
const ADMIN_ADDRESS = "GALJ6O2J66XUEBXXJBWCB2KXNFOCMBLIUF4NBXQZRYC3IWBJK7C6O2V3";

const rpc = new SorobanRpc.Server(RPC_URL);

// Fake 32-byte commitment (just for testing serialization)
const fakeCommitment = new Uint8Array(32);
fakeCommitment[0] = 0xaa;
fakeCommitment[31] = 0xbb;

// Fake encrypted note (variable length bytes, like NaCl secretbox output)
const fakeNote = new Uint8Array(120);
fakeNote.fill(0x42);

console.log("=== Testing deposit() XDR serialization ===\n");

// Method 1: Current code approach (toScBytes with Buffer.from)
console.log("--- Method 1: scvBytes(Buffer.from(uint8array)) ---");
try {
  const arg0 = new Address(ADMIN_ADDRESS).toScVal();
  console.log("  arg0 (address):", arg0.switch().name, "✓");

  const arg1 = xdr.ScVal.scvBytes(Buffer.from(fakeCommitment));
  console.log("  arg1 (commitment):", arg1.switch().name, "length:", arg1.bytes().length, "✓");

  const arg2 = xdr.ScVal.scvBytes(Buffer.from(fakeNote));
  console.log("  arg2 (note):", arg2.switch().name, "length:", arg2.bytes().length, "✓");

  // Build the actual transaction
  const account = await rpc.getAccount(ADMIN_ADDRESS);
  const contract = new Contract(POOL_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("deposit", arg0, arg1, arg2))
    .setTimeout(30)
    .build();

  console.log("  Transaction built ✓");
  console.log("  XDR length:", tx.toXDR().length);

  // Simulate
  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log("  Simulation ERROR (expected - fake data):", sim.error);
  } else {
    console.log("  Simulation OK ✓");
  }
} catch (e) {
  console.error("  FAILED:", e.message);
  console.error("  Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
}

// Method 2: nativeToScVal approach
console.log("\n--- Method 2: nativeToScVal for bytes ---");
try {
  const arg0 = nativeToScVal(ADMIN_ADDRESS, { type: "address" });
  console.log("  arg0 (address):", arg0.switch().name, "✓");

  const arg1 = nativeToScVal(Buffer.from(fakeCommitment), { type: "bytes" });
  console.log("  arg1 (commitment):", arg1.switch().name, "length:", arg1.bytes().length, "✓");

  const arg2 = nativeToScVal(Buffer.from(fakeNote), { type: "bytes" });
  console.log("  arg2 (note):", arg2.switch().name, "length:", arg2.bytes().length, "✓");

  const account = await rpc.getAccount(ADMIN_ADDRESS);
  const contract = new Contract(POOL_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("deposit", arg0, arg1, arg2))
    .setTimeout(30)
    .build();

  console.log("  Transaction built ✓");

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log("  Simulation ERROR (expected - fake data):", sim.error);
  } else {
    console.log("  Simulation OK ✓");
  }
} catch (e) {
  console.error("  FAILED:", e.message);
  console.error("  Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
}

// Method 3: Raw xdr approach without Buffer
console.log("\n--- Method 3: xdr.ScVal.scvBytes(Uint8Array directly) ---");
try {
  const arg0 = new Address(ADMIN_ADDRESS).toScVal();
  console.log("  arg0 (address):", arg0.switch().name, "✓");

  // Try passing Uint8Array directly (no Buffer)
  const arg1 = xdr.ScVal.scvBytes(fakeCommitment);
  console.log("  arg1 (commitment):", arg1.switch().name, "length:", arg1.bytes().length, "✓");

  const arg2 = xdr.ScVal.scvBytes(fakeNote);
  console.log("  arg2 (note):", arg2.switch().name, "length:", arg2.bytes().length, "✓");

  const account = await rpc.getAccount(ADMIN_ADDRESS);
  const contract = new Contract(POOL_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("deposit", arg0, arg1, arg2))
    .setTimeout(30)
    .build();

  console.log("  Transaction built ✓");

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log("  Simulation ERROR (expected - fake data):", sim.error);
  } else {
    console.log("  Simulation OK ✓");
  }
} catch (e) {
  console.error("  FAILED:", e.message);
  console.error("  Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
}

// Method 4: Check assembleTransaction + fromXDR cycle
console.log("\n--- Method 4: Full assemble + XDR round-trip ---");
try {
  const arg0 = new Address(ADMIN_ADDRESS).toScVal();
  const arg1 = xdr.ScVal.scvBytes(Buffer.from(fakeCommitment));
  const arg2 = xdr.ScVal.scvBytes(Buffer.from(fakeNote));

  const account = await rpc.getAccount(ADMIN_ADDRESS);
  const contract = new Contract(POOL_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(contract.call("deposit", arg0, arg1, arg2))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    console.log("  Sim error (expected):", sim.error?.substring(0, 100));
    console.log("  NOTE: Simulation error is expected with fake commitment data");
    console.log("  The important thing is the XDR built without 'Bad union switch'");
  } else {
    // If sim succeeds, try the full assemble cycle
    const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
    console.log("  Assembled ✓");
    const xdrStr = assembled.toXDR();
    console.log("  toXDR ✓, length:", xdrStr.length);
    const parsed = TransactionBuilder.fromXDR(xdrStr, NETWORK);
    console.log("  fromXDR round-trip ✓");
  }
} catch (e) {
  console.error("  FAILED:", e.message);
  console.error("  Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
}

// Inspect SDK version
console.log("\n--- SDK Info ---");
try {
  // Check what version of stellar-sdk we have
  const pkg = await import("@stellar/stellar-sdk/package.json", { assert: { type: "json" } });
  console.log("  stellar-sdk version:", pkg.default.version);
} catch {
  console.log("  (could not read sdk version)");
}

console.log("\n=== Done ===");