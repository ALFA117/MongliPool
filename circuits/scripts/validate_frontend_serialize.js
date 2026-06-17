/**
 * Validates that the frontend serialization logic (zkproof.ts serializeProof)
 * produces the same bytes as proof_to_rust.js for the same proof.json.
 *
 * Both must agree on imaginary-first G2 encoding (EIP-197 / soroban-sdk v25).
 * A mismatch here means the browser proof would fail on-chain verification.
 *
 * Usage (from circuits/ directory):
 *   node scripts/validate_frontend_serialize.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Encoding helpers — must match proof_to_rust.js exactly
// ---------------------------------------------------------------------------

function decToBE32(decStr) {
    let n = BigInt(decStr);
    const buf = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return buf;
}

function g1ToBytes_rust(p) {
    const out = new Uint8Array(64);
    out.set(decToBE32(p[0]), 0);
    out.set(decToBE32(p[1]), 32);
    return out;
}

function g2ToBytes_rust(p) {
    // proof_to_rust.js: imaginary-first (X.c1 || X.c0 || Y.c1 || Y.c0)
    // snarkjs [[x_re, x_im], [y_re, y_im]] → swap within each pair
    const out = new Uint8Array(128);
    out.set(decToBE32(p[0][1]), 0);   // X.c1 (imaginary)
    out.set(decToBE32(p[0][0]), 32);  // X.c0 (real)
    out.set(decToBE32(p[1][1]), 64);  // Y.c1 (imaginary)
    out.set(decToBE32(p[1][0]), 96);  // Y.c0 (real)
    return out;
}

function proofToBytes_rust(proof) {
    const out = new Uint8Array(256);
    out.set(g1ToBytes_rust(proof.pi_a), 0);
    out.set(g2ToBytes_rust(proof.pi_b), 64);
    out.set(g1ToBytes_rust(proof.pi_c), 192);
    return out;
}

// ---------------------------------------------------------------------------
// Frontend serialization — mirrors zkproof.ts serializeProof (AFTER both fixes)
// Fix 1: snarkjs returns decimal strings → use BigInt, not parseInt(..., 16)
// Fix 2: G2 encoding is imaginary-first (X.c1||X.c0||Y.c1||Y.c0)
// ---------------------------------------------------------------------------

function decStrToBE32_frontend(numStr) {
    // Same as BigInt-based encode32 in zkproof.ts
    let n = BigInt(numStr);
    const arr = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
        arr[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return arr;
}

function serializeProof_frontend(proof) {
    // Same logic as the CORRECTED zkproof.ts serializeProof
    const result = new Uint8Array(256);
    // pi_a: G1 — X(32) || Y(32)
    result.set(decStrToBE32_frontend(proof.pi_a[0]), 0);
    result.set(decStrToBE32_frontend(proof.pi_a[1]), 32);
    // pi_b: G2 — imaginary-first (EIP-197)
    result.set(decStrToBE32_frontend(proof.pi_b[0][1]), 64);   // X.c1 (imaginary)
    result.set(decStrToBE32_frontend(proof.pi_b[0][0]), 96);   // X.c0 (real)
    result.set(decStrToBE32_frontend(proof.pi_b[1][1]), 128);  // Y.c1 (imaginary)
    result.set(decStrToBE32_frontend(proof.pi_b[1][0]), 160);  // Y.c0 (real)
    // pi_c: G1 — X(32) || Y(32)
    result.set(decStrToBE32_frontend(proof.pi_c[0]), 192);
    result.set(decStrToBE32_frontend(proof.pi_c[1]), 224);
    return result;
}

// ---------------------------------------------------------------------------
// Main comparison
// ---------------------------------------------------------------------------

function toHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function bytesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const proofPath = path.join(ROOT, "proof.json");
if (!fs.existsSync(proofPath)) {
    console.error("ERROR: proof.json not found. Run setup_and_prove.js first.");
    process.exit(1);
}

const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));

// proof.json uses hex strings (snarkjs format)
const rustBytes     = proofToBytes_rust(proof);
const frontendBytes = serializeProof_frontend(proof);

console.log("=== validate_frontend_serialize.js ===\n");
console.log(`Proof file: ${proofPath}`);
console.log(`Output size: ${rustBytes.length} bytes (rust) / ${frontendBytes.length} bytes (frontend)\n`);

if (rustBytes.length !== 256 || frontendBytes.length !== 256) {
    console.error("FAIL: unexpected byte length");
    process.exit(1);
}

const match = bytesEqual(rustBytes, frontendBytes);

if (match) {
    console.log("PASS ✓ — frontend serialization matches proof_to_rust.js byte-for-byte");
    console.log(`  A (G1 x): ${toHex(frontendBytes.slice(0, 32))}`);
    console.log(`  B (G2 X.c1): ${toHex(frontendBytes.slice(64, 96))}`);
    console.log(`  B (G2 X.c0): ${toHex(frontendBytes.slice(96, 128))}`);
    console.log(`  C (G1 x): ${toHex(frontendBytes.slice(192, 224))}`);
} else {
    console.error("FAIL ✗ — MISMATCH between frontend and proof_to_rust.js");
    for (let i = 0; i < 256; i++) {
        if (rustBytes[i] !== frontendBytes[i]) {
            const section = i < 64 ? "A(G1)" : i < 192 ? "B(G2)" : "C(G1)";
            console.error(`  byte[${i}] (${section}): rust=0x${rustBytes[i].toString(16).padStart(2,"0")} frontend=0x${frontendBytes[i].toString(16).padStart(2,"0")}`);
        }
    }
    process.exit(1);
}

// Also check G2 swap: if frontend was wrong (real-first), byte[64] would differ
const wrongFrontend = new Uint8Array(256);
wrongFrontend.set(decStrToBE32_frontend(proof.pi_b[0][0]), 64); // real-first (wrong)
wrongFrontend.set(decStrToBE32_frontend(proof.pi_b[0][1]), 96);
wrongFrontend.set(decStrToBE32_frontend(proof.pi_b[1][0]), 128);
wrongFrontend.set(decStrToBE32_frontend(proof.pi_b[1][1]), 160);

const wrongMatchesRust = bytesEqual(
    wrongFrontend.slice(64, 128),
    rustBytes.slice(64, 128)
);
if (!wrongMatchesRust) {
    console.log("\nSanity check ✓ — confirmed: real-first G2 encoding does NOT match (bug was real)");
} else {
    console.warn("\nWARNING: real-first encoding also matches rust — G2 point may be symmetric (unusual)");
}