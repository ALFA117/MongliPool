import * as snarkjs from "snarkjs";
import { StrKey } from "@stellar/stellar-sdk";
import { computeNullifierHash } from "./crypto";

export interface WithdrawInput {
  secret: bigint;
  nullifierSecret: bigint;
  amount: bigint;
  poolPathElements: bigint[];
  poolPathIndices: number[];
  aspPathElements: bigint[];
  aspPathIndices: number[];
  poolMerkleRoot: bigint;
  aspMerkleRoot: bigint;
  recipient: bigint; // Stellar address encoded as field element
  amountPub: bigint;
}

export interface ZKProof {
  proofBytes: Uint8Array;
  publicSignals: string[];
  nullifierHash: bigint;
}

export type ProgressCallback = (step: string, pct: number) => void;

/** Generate a Groth16 ZK proof for a withdrawal */
export async function generateWithdrawProof(
  input: WithdrawInput,
  onProgress?: ProgressCallback
): Promise<ZKProof> {
  onProgress?.("Preparando circuito...", 5);

  const wasmPath = "/keys/withdraw.wasm";
  const zkeyPath = "/keys/withdraw_final.zkey";

  const nullifierHash = await computeNullifierHash(input.nullifierSecret);

  onProgress?.("Construyendo inputs...", 15);

  // snarkjs expects numeric strings for field elements
  const circuitInput = {
    secret: input.secret.toString(),
    nullifierSecret: input.nullifierSecret.toString(),
    amount: input.amount.toString(),
    poolPathElements: input.poolPathElements.map((x) => x.toString()),
    poolPathIndices: input.poolPathIndices.map((x) => x.toString()),
    aspPathElements: input.aspPathElements.map((x) => x.toString()),
    aspPathIndices: input.aspPathIndices.map((x) => x.toString()),
    poolMerkleRoot: input.poolMerkleRoot.toString(),
    aspMerkleRoot: input.aspMerkleRoot.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: input.recipient.toString(),
    amountPub: input.amountPub.toString(),
  };

  onProgress?.("Generando prueba ZK (puede tomar ~30s)...", 25);

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmPath,
    zkeyPath,
    undefined,
    (update: { delta: number }) => {
      if (onProgress && update.delta) {
        onProgress?.("Generando prueba ZK...", 25 + Math.round(update.delta * 65));
      }
    }
  );

  onProgress?.("Serializando prueba...", 92);

  // Serialize proof to bytes for Soroban contract
  const proofBytes = serializeProof(proof);

  onProgress?.("Listo.", 100);

  return {
    proofBytes,
    publicSignals,
    nullifierHash,
  };
}

/** Verify a proof locally before submitting on-chain */
export async function verifyProofLocally(
  proof: snarkjs.Groth16Proof,
  publicSignals: string[],
  vkPath = "/keys/verification_key.json"
): Promise<boolean> {
  const vkResponse = await fetch(vkPath);
  const vk = await vkResponse.json();
  return await snarkjs.groth16.verify(vk, publicSignals, proof);
}

/** Encode Groth16 proof to bytes for the Soroban verifier */
function serializeProof(proof: snarkjs.Groth16Proof): Uint8Array {
  // Each G1 point: 2 × 32 bytes; G2 point: 4 × 32 bytes
  // Total: A(64) + B(128) + C(64) = 256 bytes
  //
  // snarkjs returns coordinates as decimal strings (not hex).
  // We use BigInt for correct parsing of arbitrary-precision integers.
  const encode32 = (numStr: string): Uint8Array => {
    let n = BigInt(numStr); // handles decimal strings from snarkjs
    const arr = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
      arr[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return arr;
  };

  const result = new Uint8Array(256);
  // pi_a: G1 point — X(32) || Y(32)
  result.set(encode32(proof.pi_a[0]), 0);
  result.set(encode32(proof.pi_a[1]), 32);
  // pi_b: G2 point — imaginary-first (EIP-197 / soroban-sdk v25 convention)
  // snarkjs stores [[x_re, x_im], [y_re, y_im]]; contract expects X.c1||X.c0||Y.c1||Y.c0
  result.set(encode32(proof.pi_b[0][1]), 64);   // X.c1 (imaginary)
  result.set(encode32(proof.pi_b[0][0]), 96);   // X.c0 (real)
  result.set(encode32(proof.pi_b[1][1]), 128);  // Y.c1 (imaginary)
  result.set(encode32(proof.pi_b[1][0]), 160);  // Y.c0 (real)
  // pi_c: G1 point — X(32) || Y(32)
  result.set(encode32(proof.pi_c[0]), 192);
  result.set(encode32(proof.pi_c[1]), 224);

  return result;
}

/** Encode a Stellar address to a BN254 field element for the circuit.
 *  Decodes the StrKey G-address to its raw 32-byte ed25519 public key,
 *  then interprets those bytes as a big-endian integer reduced mod BN254 prime. */
export function addressToField(address: string): bigint {
  const rawKey = StrKey.decodeEd25519PublicKey(address);
  const BN254_PRIME =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  let val = 0n;
  for (const b of rawKey) {
    val = (val * 256n + BigInt(b)) % BN254_PRIME;
  }
  return val;
}