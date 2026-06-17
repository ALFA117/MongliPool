/**
 * Trusted setup for MongliPool withdraw circuit.
 * Run once after compiling the circuit.
 * Uses the Hermez ceremony ptau file (powers of tau, 2^20 constraints).
 *
 * Steps:
 *   1. npm install
 *   2. npm run compile  (requires circom in PATH)
 *   3. node scripts/setup.js
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "../build");
const PTAU_PATH = path.join(BUILD_DIR, "pot20_final.ptau");
const R1CS_PATH = path.join(BUILD_DIR, "withdraw.r1cs");
const ZKEY_0_PATH = path.join(BUILD_DIR, "withdraw_0.zkey");
const ZKEY_FINAL_PATH = path.join(BUILD_DIR, "withdraw_final.zkey");
const VK_PATH = path.join(BUILD_DIR, "verification_key.json");

// Download URL for the Hermez ceremony ptau (trusted, community-generated)
const PTAU_URL =
  "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau";

async function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  if (!fs.existsSync(PTAU_PATH)) {
    console.log("ptau file not found. Download it with:");
    console.log(`  curl -o ${PTAU_PATH} ${PTAU_URL}`);
    console.log("Or use a smaller ptau for development:");
    console.log(
      "  snarkjs powersoftau new bn128 20 pot20_0000.ptau && snarkjs powersoftau prepare phase2 pot20_0000.ptau pot20_final.ptau"
    );
    process.exit(1);
  }

  if (!fs.existsSync(R1CS_PATH)) {
    console.error("r1cs not found. Run: npm run compile");
    process.exit(1);
  }

  console.log("Phase 2 setup...");
  await snarkjs.zKey.newZKey(R1CS_PATH, PTAU_PATH, ZKEY_0_PATH);

  // Contribute randomness (in production: use multiple parties)
  await snarkjs.zKey.contribute(
    ZKEY_0_PATH,
    ZKEY_FINAL_PATH,
    "MongliPool hackathon contributor",
    "random entropy for hackathon setup"
  );

  // Export verification key
  const vk = await snarkjs.zKey.exportVerificationKey(ZKEY_FINAL_PATH);
  fs.writeFileSync(VK_PATH, JSON.stringify(vk, null, 2));

  console.log("Setup complete!");
  console.log(`  Final zkey: ${ZKEY_FINAL_PATH}`);
  console.log(`  Verification key: ${VK_PATH}`);
  console.log("\nCopy these to the frontend:");
  console.log("  cp build/withdraw_final.zkey ../frontend/public/keys/");
  console.log("  cp build/withdraw_js/withdraw.wasm ../frontend/public/keys/");
  console.log("  cp build/verification_key.json ../frontend/public/keys/");
}

main().catch(console.error);