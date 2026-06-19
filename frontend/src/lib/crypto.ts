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
// Asymmetric encryption: NaCl box (Curve25519 + XSalsa20 + Poly1305)
// Each deposit generates an ephemeral keypair. Only the DAO's private key can decrypt.
// -------------------------

/** Mongli DAO public key — embedded in frontend by design (public keys are public).
 *  The corresponding private key is managed offline by Mongli DAO. */
export const DAO_PUBLIC_KEY = hexToBytes(
  "21fe6bc9b51c2f24880287dc293023873309265a77e53c8ac6c58bd75cf93759"
);

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Encrypt a note to the DAO using NaCl box with an ephemeral keypair.
 *  Format: [ephemeralPublicKey: 32][nonce: 24][ciphertext: variable] */
export function encryptNote(
  daoPublicKey: Uint8Array,
  plaintext: Uint8Array
): Uint8Array {
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const ciphertext = nacl.box(plaintext, nonce, daoPublicKey, ephemeral.secretKey);
  if (!ciphertext) throw new Error("Encryption failed");

  const result = new Uint8Array(32 + nacl.box.nonceLength + ciphertext.length);
  result.set(ephemeral.publicKey, 0);
  result.set(nonce, 32);
  result.set(ciphertext, 32 + nacl.box.nonceLength);
  return result;
}

/** Decrypt a note using the DAO's private key.
 *  Returns null if the key is wrong or data is corrupted. */
export function decryptNote(
  daoSecretKey: Uint8Array,
  encryptedNote: Uint8Array
): Uint8Array | null {
  if (encryptedNote.length < 72) return null;

  const ephemeralPublicKey = encryptedNote.slice(0, 32);
  const nonce = encryptedNote.slice(32, 56);
  const ciphertext = encryptedNote.slice(56);

  return nacl.box.open(ciphertext, nonce, ephemeralPublicKey, daoSecretKey);
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