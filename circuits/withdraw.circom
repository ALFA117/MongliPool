pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/mux1.circom";
include "node_modules/circomlib/circuits/bitify.circom";

// Merkle tree inclusion proof (depth 20 = up to 1M leaves)
template MerkleProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output root;

    component hashers[depth];
    component muxes[depth];

    signal hashes[depth + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        muxes[i] = Mux1();
        muxes[i].c[0] <== hashes[i];
        muxes[i].c[1] <== pathElements[i];
        muxes[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== muxes[i].out;
        hashers[i].inputs[1] <== pathElements[i] + hashes[i] - muxes[i].out;

        hashes[i + 1] <== hashers[i].out;
    }

    root <== hashes[depth];
}

// Main withdrawal circuit
template Withdraw(depth) {
    // --- Private inputs ---
    signal input secret;
    signal input nullifierSecret;
    signal input amount;
    signal input poolPathElements[depth];
    signal input poolPathIndices[depth];
    signal input aspPathElements[depth];
    signal input aspPathIndices[depth];

    // --- Public inputs ---
    signal input poolMerkleRoot;
    signal input aspMerkleRoot;
    signal input nullifierHash;
    signal input recipient;  // bound to proof to prevent front-running
    signal input amountPub;

    // 1. Compute commitment = Poseidon(secret, nullifierSecret, amount)
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifierSecret;
    commitmentHasher.inputs[2] <== amount;
    signal commitment;
    commitment <== commitmentHasher.out;

    // 2. Verify commitment is in pool Merkle tree
    component poolProof = MerkleProof(depth);
    poolProof.leaf <== commitment;
    for (var i = 0; i < depth; i++) {
        poolProof.pathElements[i] <== poolPathElements[i];
        poolProof.pathIndices[i] <== poolPathIndices[i];
    }
    poolProof.root === poolMerkleRoot;

    // 3. Verify commitment is in ASP-approved Merkle tree
    component aspProof = MerkleProof(depth);
    aspProof.leaf <== commitment;
    for (var i = 0; i < depth; i++) {
        aspProof.pathElements[i] <== aspPathElements[i];
        aspProof.pathIndices[i] <== aspPathIndices[i];
    }
    aspProof.root === aspMerkleRoot;

    // 4. Verify nullifier hash = Poseidon(nullifierSecret)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifierSecret;
    nullifierHasher.out === nullifierHash;

    // 5. Bind public amount to private amount (prevents amount malleability)
    amount === amountPub;

    // 6. recipient signal is used in public inputs to bind proof to recipient
    //    (no arithmetic constraint needed — just appearing as public input
    //     makes it part of the proof and prevents proof reuse with different recipient)
    signal recipientSquared;
    recipientSquared <== recipient * recipient;
}

component main {public [poolMerkleRoot, aspMerkleRoot, nullifierHash, recipient, amountPub]} = Withdraw(20);