/**
 * CLI admin script: fetch all pool commitments, rebuild Poseidon Merkle tree,
 * then call pool::update_root() and asp::update_asp_root() via stellar CLI.
 *
 * Run this after every deposit if the browser auto-update fails:
 *   node scripts/admin_update_roots.js
 *
 * Requires: stellar CLI on PATH, deployer key in stellar identity store.
 */

const { execSync } = require("child_process");
const { poseidon2 } = require("poseidon-lite");

const POOL_ID  = "CDGY6VEK6EOCNA2DIM2PCYQGUVOYHB4G76I6A65MRHQ6MUCXA5EHTSMN";
const ASP_ID   = "CADASIHQGQ5LVVXEXBLMTXJJO7MSPXAF2QHADH4A7JYDRW2LGGGAZ653";
const NETWORK  = "testnet";
const SOURCE   = "deployer";
const DEPTH    = 20;

// ─── Merkle tree (mirrors frontend/src/lib/merkle.ts) ────────────────────────

function buildZeroHashes() {
  const z = [0n];
  for (let i = 0; i < DEPTH; i++) z.push(poseidon2([z[i], z[i]]));
  return z;
}

class PoseidonMerkleTree {
  constructor() {
    this.leaves = [];
    this.nodes  = new Map();
    this.zeros  = buildZeroHashes();
  }
  key(l, i) { return `${l}:${i}`; }
  get(l, i)  { return this.nodes.get(this.key(l, i)) ?? this.zeros[l]; }
  set(l, i, v) { this.nodes.set(this.key(l, i), v); }
  insert(leaf) {
    const idx = this.leaves.length;
    this.leaves.push(leaf);
    this.set(0, idx, leaf);
    let cur = idx;
    for (let l = 0; l < DEPTH; l++) {
      const sib = cur % 2 === 0 ? cur + 1 : cur - 1;
      const parent = Math.floor(cur / 2);
      const [left, right] = cur % 2 === 0 ? [this.get(l, cur), this.get(l, sib)] : [this.get(l, sib), this.get(l, cur)];
      this.set(l + 1, parent, poseidon2([left, right]));
      cur = parent;
    }
  }
  getRoot() { return this.get(DEPTH, 0); }
}

function bigintToHex32(n) {
  return n.toString(16).padStart(64, "0");
}

// ─── Fetch commitments from pool via stellar CLI simulation ──────────────────

function getCommitments() {
  const out = execSync(
    `stellar contract invoke --id ${POOL_ID} --source ${SOURCE} --network ${NETWORK} -- get_commitments`,
    { encoding: "utf8" }
  ).trim();
  // Output is a JSON array of hex strings (Bytes as hex from stellar CLI)
  try {
    const parsed = JSON.parse(out);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => {
      // stellar CLI returns bytes as arrays of numbers or hex strings
      if (typeof item === "string") return item;
      if (Array.isArray(item)) return Buffer.from(item).toString("hex");
      return "";
    }).filter(Boolean);
  } catch {
    console.error("Failed to parse commitments:", out);
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("Fetching pool commitments...");
const commitmentHexes = getCommitments();
console.log(`Found ${commitmentHexes.length} commitments`);

if (commitmentHexes.length === 0) {
  console.log("No commitments yet — nothing to update.");
  process.exit(0);
}

const tree = new PoseidonMerkleTree();
for (const hex of commitmentHexes) {
  tree.insert(BigInt("0x" + hex));
}
const rootHex = bigintToHex32(tree.getRoot());
console.log(`New Merkle root: ${rootHex}`);

console.log("Updating pool root...");
execSync(
  `stellar contract invoke --id ${POOL_ID} --source ${SOURCE} --network ${NETWORK} -- update_root --new_root ${rootHex}`,
  { stdio: "inherit" }
);

console.log("Updating ASP root...");
execSync(
  `stellar contract invoke --id ${ASP_ID} --source ${SOURCE} --network ${NETWORK} -- update_asp_root --new_root ${rootHex}`,
  { stdio: "inherit" }
);

console.log("Done. Both roots updated to:", rootHex);