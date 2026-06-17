/**
 * Serializes verification_key.json to the binary format expected by
 * groth16-verifier::initialize(vk_bytes: Bytes).
 *
 * Layout (same as documented in groth16-verifier/src/lib.rs):
 *   [0   .. 64 ] alpha_g1  : G1 (64 bytes)
 *   [64  .. 192] beta_g2   : G2 (128 bytes)
 *   [192 .. 320] gamma_g2  : G2 (128 bytes)
 *   [320 .. 448] delta_g2  : G2 (128 bytes)
 *   [448 .. 452] num_ic    : u32 big-endian
 *   [452 ..    ] IC[]      : G1, 64 bytes each
 *
 * G1: be(X) || be(Y) – 64 bytes
 * G2: be(X.c1) || be(X.c0) || be(Y.c1) || be(Y.c0) – 128 bytes (EIP-197, imaginary-first)
 *
 * Output: hex string (no 0x prefix), printed to stdout.
 * Usage: node scripts/vk_to_hex.js circuits/verification_key.json
 */

const fs = require("fs");

const vkPath = process.argv[2] || "circuits/verification_key.json";
const vk = JSON.parse(fs.readFileSync(vkPath, "utf8"));

function decToBE32(decStr) {
    let n = BigInt(decStr);
    const buf = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) { buf[i] = Number(n & 0xffn); n >>= 8n; }
    return buf;
}

function g1ToBytes(p) {
    const out = new Uint8Array(64);
    out.set(decToBE32(p[0]), 0);
    out.set(decToBE32(p[1]), 32);
    return out;
}

// EIP-197: X.c1 || X.c0 || Y.c1 || Y.c0 (imaginary first)
function g2ToBytes(p) {
    const out = new Uint8Array(128);
    out.set(decToBE32(p[0][1]), 0);   // X.c1
    out.set(decToBE32(p[0][0]), 32);  // X.c0
    out.set(decToBE32(p[1][1]), 64);  // Y.c1
    out.set(decToBE32(p[1][0]), 96);  // Y.c0
    return out;
}

const numIc = vk.IC.length;
const numIcBuf = new Uint8Array(4);
numIcBuf[0] = (numIc >> 24) & 0xff;
numIcBuf[1] = (numIc >> 16) & 0xff;
numIcBuf[2] = (numIc >>  8) & 0xff;
numIcBuf[3] =  numIc        & 0xff;

const parts = [
    g1ToBytes(vk.vk_alpha_1),
    g2ToBytes(vk.vk_beta_2),
    g2ToBytes(vk.vk_gamma_2),
    g2ToBytes(vk.vk_delta_2),
    numIcBuf,
    ...vk.IC.map(p => g1ToBytes(p)),
];

const totalLen = 64 + 128 + 128 + 128 + 4 + numIc * 64;
const out = new Uint8Array(totalLen);
let offset = 0;
for (const part of parts) { out.set(part, offset); offset += part.length; }

process.stdout.write(Buffer.from(out).toString("hex") + "\n");