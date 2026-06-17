/**
 * Generates a valid input.json for the withdraw.circom circuit.
 *
 * Uses circomlibjs Poseidon to compute:
 *   commitment     = Poseidon(secret, nullifierSecret, amount)
 *   nullifierHash  = Poseidon(nullifierSecret)
 *   Merkle root    = single-leaf depth-20 Poseidon tree (leaf = commitment at index 0)
 *
 * The pool and ASP trees are the same (MVP simplification).
 *
 * Run: node scripts/generate_input.js > input.json
 */

const { buildPoseidon } = require("circomlibjs");

const DEPTH = 20;
const AMOUNT = BigInt("10000000"); // 10 USDC (7 decimals)

async function main() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // --- Fixed test values ---
    const secret         = BigInt("1111111111111111111");
    const nullifierSecret = BigInt("2222222222222222222");
    const recipient      = BigInt("3333333333333333333"); // arbitrary field element

    // --- Core hashes ---
    const commitment = F.toObject(poseidon([secret, nullifierSecret, AMOUNT]));
    const nullifierHash = F.toObject(poseidon([nullifierSecret]));

    // --- Build zero-hash chain (empty-tree siblings) ---
    // zero_hash[0] = 0 (empty leaf)
    // zero_hash[i+1] = Poseidon(zero_hash[i], zero_hash[i])
    const zeroHashes = [BigInt(0)];
    for (let i = 0; i < DEPTH; i++) {
        const z = zeroHashes[i];
        zeroHashes.push(F.toObject(poseidon([z, z])));
    }

    // --- Merkle path for commitment at index 0 ---
    // All pathIndices = 0 (our leaf is always on the left)
    // Siblings = zero hashes at each level
    const pathElements = zeroHashes.slice(0, DEPTH).map(h => h.toString());
    const pathIndices  = Array(DEPTH).fill("0");

    // --- Compute root ---
    let cur = commitment;
    for (let i = 0; i < DEPTH; i++) {
        cur = F.toObject(poseidon([cur, zeroHashes[i]]));
    }
    const root = cur;

    // --- Sanity log (stderr so it doesn't pollute stdout JSON) ---
    process.stderr.write(`commitment:    ${commitment}\n`);
    process.stderr.write(`nullifierHash: ${nullifierHash}\n`);
    process.stderr.write(`merkleRoot:    ${root}\n`);

    // --- Output input.json ---
    const input = {
        secret:           secret.toString(),
        nullifierSecret:  nullifierSecret.toString(),
        amount:           AMOUNT.toString(),
        poolPathElements: pathElements,
        poolPathIndices:  pathIndices,
        aspPathElements:  pathElements,
        aspPathIndices:   pathIndices,
        poolMerkleRoot:   root.toString(),
        aspMerkleRoot:    root.toString(),
        nullifierHash:    nullifierHash.toString(),
        recipient:        recipient.toString(),
        amountPub:        AMOUNT.toString(),
    };

    process.stdout.write(JSON.stringify(input, null, 2) + "\n");
}

main().catch(err => { console.error(err); process.exit(1); });