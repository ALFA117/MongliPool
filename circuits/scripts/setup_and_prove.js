/**
 * Full pipeline after pot15_final.ptau exists:
 *   groth16 setup → zkey contribute → export VK → witness → prove → verify
 *
 * Run: node scripts/setup_and_prove.js
 * Working dir: circuits/
 *
 * Outputs: withdraw_final.zkey, verification_key.json, witness.wtns, proof.json, public.json
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname + "/..";

function run(cmd, label) {
    process.stderr.write(`\n>>> ${label}\n$ ${cmd}\n`);
    const start = Date.now();
    execSync(cmd, { cwd: ROOT, stdio: "inherit" });
    process.stderr.write(`    done in ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
}

async function main() {
    // 1. groth16 phase 2 setup
    run(
        "snarkjs groth16 setup build/withdraw.r1cs pot15_final.ptau withdraw_0.zkey",
        "Groth16 setup (phase 2)"
    );

    // 2. zkey phase 2 contribution
    run(
        `snarkjs zkey contribute withdraw_0.zkey withdraw_final.zkey --name="MongliPool" -e="monglipool hackathon zk 2025"`,
        "zkey phase 2 contribution"
    );

    // 3. Export verification key
    run(
        "snarkjs zkey export verificationkey withdraw_final.zkey verification_key.json",
        "Export verification key"
    );

    // 4. Generate witness
    run(
        "node build/withdraw_js/generate_witness.js build/withdraw_js/withdraw.wasm input.json witness.wtns",
        "Generate witness"
    );

    // 5. Prove
    run(
        "snarkjs groth16 prove withdraw_final.zkey witness.wtns proof.json public.json",
        "Groth16 prove"
    );

    // 6. Local verify
    run(
        "snarkjs groth16 verify verification_key.json public.json proof.json",
        "Local verify (snarkjs)"
    );

    // 7. Print summary
    const proof = JSON.parse(fs.readFileSync(`${ROOT}/proof.json`, "utf8"));
    const pub   = JSON.parse(fs.readFileSync(`${ROOT}/public.json`, "utf8"));
    const vk    = JSON.parse(fs.readFileSync(`${ROOT}/verification_key.json`, "utf8"));

    process.stderr.write("\n=== PROOF SUMMARY ===\n");
    process.stderr.write(`pi_a: ${proof.pi_a[0].slice(0,20)}...\n`);
    process.stderr.write(`pi_b: ${proof.pi_b[0][0].slice(0,20)}...\n`);
    process.stderr.write(`pi_c: ${proof.pi_c[0].slice(0,20)}...\n`);
    process.stderr.write(`public inputs (${pub.length}): ${pub.map(v => v.slice(0,10) + "...").join(", ")}\n`);
    process.stderr.write(`IC points: ${vk.IC.length}\n`);
    process.stderr.write("\nAll OK. Run: node scripts/proof_to_rust.js proof.json public.json verification_key.json\n");
}

main().catch(err => { console.error(err); process.exit(1); });