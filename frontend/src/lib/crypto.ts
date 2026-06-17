import { poseidon1, poseidon3 } from "poseidon-lite";
import nacl from "tweetnacl";

/** Generate cryptographically secure random 32-byte field element */
export function randomFieldElement(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // Reduce mod BN254 field prime to ensure valid field element
  const BN254_PRIME =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  let val = 0n;
  for (const b of bytes) {
    val = (val * 256n + BigInt(b)) % BN254_PRIME;
  }
  return val;
}

/** Compute commitment = Poseidon(secret, nullifierSecret, amount) */
export async function computeCommitment(
  secret: bigint,
  nullifierSecret: bigint,
  amount: bigint
): Promise<bigint> {
  return poseidon3([secret, nullifierSecret, amount]);
}

/** Compute nullifier hash = Poseidon(nullifierSecret) */
export async function computeNullifierHash(nullifierSecret: bigint): Promise<bigint> {
  return poseidon1([nullifierSecret]);
}

/** Encode a bigint as a 32-byte big-endian hex string */
export function bigintToHex32(val: bigint): string {
  return val.toString(16).padStart(64, "0");
}

/** Decode a 32-byte hex string to bigint */
export function hex32ToBigint(hex: string): bigint {
  return BigInt("0x" + hex.replace(/^0x/, ""));
}

/** Encode a bigint as bytes32 (Uint8Array, 32 bytes, big-endian) */
export function bigintToBytes32(val: bigint): Uint8Array {
  const hex = val.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// -------------------------
// View key encryption (NaCl box — symmetric for MVP)
// In production: use auditor's public key for asymmetric encryption
// -------------------------

/** Encrypt a note with the DAO view key (NaCl secretbox) */
export function encryptNote(
  viewKey: Uint8Array, // 32 bytes
  plaintext: Uint8Array
): Uint8Array {
  const nonce = crypto.getRandomValues(new Uint8Array(nacl.secretbox.nonceLength));
  const ciphertext = nacl.secretbox(plaintext, nonce, viewKey);
  // Prepend nonce to ciphertext
  const result = new Uint8Array(nonce.length + ciphertext.length);
  result.set(nonce);
  result.set(ciphertext, nonce.length);
  return result;
}

/** Decrypt a note with the DAO view key */
export function decryptNote(
  viewKey: Uint8Array,
  encryptedWithNonce: Uint8Array
): Uint8Array | null {
  const nonce = encryptedWithNonce.slice(0, nacl.secretbox.nonceLength);
  const ciphertext = encryptedWithNonce.slice(nacl.secretbox.nonceLength);
  return nacl.secretbox.open(ciphertext, nonce, viewKey);
}

/** Encode a deposit note as bytes for encryption */
export function encodeNote(secret: bigint, nullifierSecret: bigint, amount: bigint): Uint8Array {
  const buf = new Uint8Array(96); // 3 × 32 bytes
  buf.set(bigintToBytes32(secret), 0);
  buf.set(bigintToBytes32(nullifierSecret), 32);
  buf.set(bigintToBytes32(amount), 64);
  return buf;
}

/** Decode a note from bytes */
export function decodeNote(buf: Uint8Array): {
  secret: bigint;
  nullifierSecret: bigint;
  amount: bigint;
} {
  const toBI = (slice: Uint8Array) => {
    let val = 0n;
    for (const b of slice) val = val * 256n + BigInt(b);
    return val;
  };
  return {
    secret: toBI(buf.slice(0, 32)),
    nullifierSecret: toBI(buf.slice(32, 64)),
    amount: toBI(buf.slice(64, 96)),
  };
}

/** Convert bytes to base64 for display */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Convert base64 to bytes */
export function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}